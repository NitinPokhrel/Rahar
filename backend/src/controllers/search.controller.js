// controllers/adminSearchController.js
import { Op } from "sequelize";
import {
  Product,
  User,
  Order,
  OrderItem,
  ProductVariant,
  Coupon,
  Review,
  Category,
  sequelize, 
  Sequelize
} from "../models/index.model.js";


export const searchProducts = async (req, res) => {
  // N-gram generation for fuzzy matching
  const generateNGrams = (text, n = 2) => {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);
    const ngrams = new Set();

    words.forEach((word) => {
      if (word.length >= n) {
        for (let i = 0; i <= word.length - n; i++) {
          ngrams.add(word.substring(i, i + n));
        }
      }
      // Add the whole word as well
      ngrams.add(word);
    });

    return Array.from(ngrams);
  };

  // Jaccard similarity for set comparison
  const jaccardSimilarity = (set1, set2) => {
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  };

  // TF-IDF-like scoring (simplified)
  const calculateTermFrequency = (term, text) => {
    const words = text.toLowerCase().split(/\s+/);
    const termCount = words.filter((word) =>
      word.includes(term.toLowerCase())
    ).length;
    return termCount / words.length;
  };

  // Soundex algorithm for phonetic matching
  const soundex = (str) => {
    const a = str.toLowerCase().split("");
    const f = a.shift();
    let r = "";
    const codes = {
      a: "",
      e: "",
      i: "",
      o: "",
      u: "",
      y: "",
      h: "",
      w: "",
      b: 1,
      f: 1,
      p: 1,
      v: 1,
      c: 2,
      g: 2,
      j: 2,
      k: 2,
      q: 2,
      s: 2,
      x: 2,
      z: 2,
      d: 3,
      t: 3,
      l: 4,
      m: 5,
      n: 5,
      r: 6,
    };

    r =
      f +
      a
        .map((v) => codes[v])
        .filter((v, i, arr) => (i === 0 ? v !== codes[f] : v !== arr[i - 1]))
        .join("");

    return (r + "000").substring(0, 4).toUpperCase();
  };

  // Levenshtein distance with optimization
  const levenshteinDistance = (str1, str2) => {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;

    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Advanced text preprocessing
  const preprocessText = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, "") // Remove stop words
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  };

  // Extract meaningful terms (remove common words, numbers)
  const extractMeaningfulTerms = (text) => {
    const processed = preprocessText(text);
    const words = processed.split(" ").filter(
      (word) =>
        word.length > 2 &&
        !/^\d+$/.test(word) && // Not just numbers
        word !== ""
    );

    // Remove duplicates and return
    return [...new Set(words)];
  };

  // Fuzzy match scoring with multiple algorithms
  const fuzzyMatch = (term, target, threshold = 0.6) => {
    const termLower = term.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match
    if (targetLower.includes(termLower)) return 1.0;

    // Levenshtein similarity
    const maxLen = Math.max(term.length, target.length);
    const levDistance = levenshteinDistance(termLower, targetLower);
    const levSimilarity = (maxLen - levDistance) / maxLen;

    // N-gram similarity
    const termNgrams = new Set(generateNGrams(term, 2));
    const targetNgrams = new Set(generateNGrams(target, 2));
    const ngramSimilarity = jaccardSimilarity(termNgrams, targetNgrams);

    // Soundex matching for phonetic similarity
    const soundexMatch = soundex(term) === soundex(target) ? 0.7 : 0;

    // Substring matching
    const substringMatch = targetLower
      .split(" ")
      .some((word) => word.includes(termLower) || termLower.includes(word))
      ? 0.8
      : 0;

    // Combined score
    const combinedScore = Math.max(
      levSimilarity * 0.4,
      ngramSimilarity * 0.3,
      soundexMatch * 0.2,
      substringMatch * 0.1
    );

    return combinedScore >= threshold ? combinedScore : 0;
  };

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  try {
    // Extract meaningful search terms
    const searchTerms = extractMeaningfulTerms(q);
    const originalQuery = preprocessText(q);

    if (searchTerms.length === 0) {
      return res.json([]);
    }

    // Build dynamic search conditions
    const searchConditions = [];

    // 1. Exact phrase matching (highest priority)
    searchConditions.push(
      { name: { [Op.iLike]: `%${originalQuery}%` } },
      { description: { [Op.iLike]: `%${originalQuery}%` } },
      { shortDescription: { [Op.iLike]: `%${originalQuery}%` } },
      { sku: { [Op.iLike]: `%${originalQuery}%` } }
    );

    // 2. Individual term matching
    searchTerms.forEach((term) => {
      searchConditions.push(
        { name: { [Op.iLike]: `%${term}%` } },
        { slug: { [Op.iLike]: `%${term}%` } },
        { description: { [Op.iLike]: `%${term}%` } },
        { shortDescription: { [Op.iLike]: `%${term}%` } },
        { sku: { [Op.iLike]: `%${term}%` } }
      );
    });

    // 3. Tag matching
    searchConditions.push({ tags: { [Op.overlap]: searchTerms } });

    // 4. PostgreSQL full-text search (if available)
    try {
      searchConditions.push(
        literal(
          `to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(short_description, '')) @@ plainto_tsquery('english', '${originalQuery.replace(
            /'/g,
            "''"
          )}')`
        )
      );
    } catch (err) {
      // Fallback if full-text search is not available
      console.log("Full-text search not available, using fallback");
    }

    // Get products with broad search
    const products = await Product.findAll({
      where: {
        [Op.or]: searchConditions,
      },
      limit: 200, // Get more for better ranking
      order: [["createdAt", "DESC"]],
    });

    // Advanced scoring algorithm
    const scoredProducts = products.map((product) => {
      const productData = product.toJSON();
      let score = 0;

      const productName = preprocessText(productData.name || "");
      const productDesc = preprocessText(productData.description || "");
      const productShortDesc = preprocessText(
        productData.shortDescription || ""
      );
      const productSku = preprocessText(productData.sku || "");
      const productTags = (productData.tags || []).map((tag) =>
        preprocessText(tag)
      );

      // 1. Exact query match (highest score)
      if (productName.includes(originalQuery)) score += 1000;
      if (productShortDesc.includes(originalQuery)) score += 800;
      if (productDesc.includes(originalQuery)) score += 600;
      if (productSku.includes(originalQuery)) score += 700;

      // 2. Individual term matching with TF-IDF-like scoring
      searchTerms.forEach((term, index) => {
        const termWeight = 1 / (index + 1); // Earlier terms have higher weight

        // Name matching (highest weight)
        const nameMatch = fuzzyMatch(term, productName);
        if (nameMatch > 0) {
          score += nameMatch * 500 * termWeight;
        }

        // SKU matching
        const skuMatch = fuzzyMatch(term, productSku);
        if (skuMatch > 0) {
          score += skuMatch * 400 * termWeight;
        }

        // Short description matching
        const shortDescMatch = fuzzyMatch(term, productShortDesc);
        if (shortDescMatch > 0) {
          score += shortDescMatch * 300 * termWeight;
        }

        // Description matching (with TF consideration)
        const descMatch = fuzzyMatch(term, productDesc);
        if (descMatch > 0) {
          const tf = calculateTermFrequency(term, productDesc);
          score += descMatch * 200 * termWeight * (1 + tf);
        }

        // Tag matching
        productTags.forEach((tag) => {
          const tagMatch = fuzzyMatch(term, tag);
          if (tagMatch > 0) {
            score += tagMatch * 250 * termWeight;
          }
        });
      });

      // 3. Multi-term bonus
      const matchedTermsCount = searchTerms.filter(
        (term) =>
          productName.includes(term) ||
          productShortDesc.includes(term) ||
          productSku.includes(term)
      ).length;

      if (matchedTermsCount > 1) {
        score += (matchedTermsCount - 1) * 100;
      }

      // 4. Completeness boost
      if (searchTerms.length > 1) {
        const coverage = matchedTermsCount / searchTerms.length;
        score += coverage * 200;
      }

      // 5. Recency boost (slight)
      const daysSinceCreated =
        (new Date() - new Date(productData.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) score += 10;
      if (daysSinceCreated < 7) score += 20;

      return {
        ...productData,
        relevanceScore: Math.round(score),
        matchedTerms: matchedTermsCount,
        searchTerms: searchTerms, // For debugging
      };
    });

    // Sort by relevance and filter low scores
    const sortedProducts = scoredProducts
      .filter((product) => product.relevanceScore > 0)
      .sort((a, b) => {
        // Primary sort by score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        // Secondary sort by matched terms count
        if (b.matchedTerms !== a.matchedTerms) {
          return b.matchedTerms - a.matchedTerms;
        }
        // Tertiary sort by creation date
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 50);

    // Clean up response (remove debug info)
    const finalResults = sortedProducts.map(
      ({ relevanceScore, matchedTerms, searchTerms, ...product }) => product
    );

    res.json(finalResults);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductSearchSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  const sanitizedQuery = q.trim().substring(0, 100);
  const searchTerm = sanitizedQuery.toLowerCase();

  try {
    // Multi-field intelligent search with relevance scoring
    const suggestions = await Product.findAll({
      where: {
        [Op.and]: [
          // Only show active products
          { isActive: true },
          // Multi-field search conditions
          {
            [Op.or]: [
              // Product name matches (highest priority)
              {
                name: {
                  [Op.iLike]: `%${sanitizedQuery}%`,
                },
              },
              // SKU matches (for model/part number searches)
              {
                sku: {
                  [Op.iLike]: `%${sanitizedQuery}%`,
                },
              },
              // Tags array contains the search term - FIXED
              sequelize.where(
                sequelize.fn('array_to_string', sequelize.col('tags'), ' '),
                { [Op.iLike]: `%${sanitizedQuery}%` }
              ),
              // Short description contains search term
              {
                shortDescription: {
                  [Op.iLike]: `%${sanitizedQuery}%`,
                },
              },
              // Meta title for SEO-friendly searches
              {
                metaTitle: {
                  [Op.iLike]: `%${sanitizedQuery}%`,
                },
              },
            ],
          },
        ],
      },
      // Include category information for better context
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
          required: false, // LEFT JOIN to include products even without category
        },
      ],
      attributes: [
        "id",
        "name",
        "slug",
        "sku",
        "price",
        "comparePrice",
        "images",
        "shortDescription",
        "stockQuantity",
        "lowStockThreshold",
        "isFeatured",
        "tags",
      ],
      limit: 15,
      order: [
        [
          sequelize.literal(`
            CASE 
              WHEN LOWER("Product"."name") = '${searchTerm.replace(/'/g, "''")}' THEN 0
              WHEN LOWER("Product"."name") LIKE '${searchTerm.replace(/'/g, "''")}%' THEN 1
              WHEN LOWER("Product"."sku") = '${searchTerm.replace(/'/g, "''")}' THEN 2
              WHEN LOWER("Product"."sku") LIKE '${searchTerm.replace(/'/g, "''")}%' THEN 3
              WHEN "Product"."isFeatured" = true AND LOWER("Product"."name") LIKE '%${searchTerm.replace(/'/g, "''")}%' THEN 4
              WHEN LOWER("Product"."name") LIKE '%${searchTerm.replace(/'/g, "''")}%' THEN 5
              WHEN array_to_string("Product"."tags", ' ') ILIKE '%${sanitizedQuery.replace(/'/g, "''")}%' THEN 6
              WHEN LOWER("Product"."sku") LIKE '%${searchTerm.replace(/'/g, "''")}%' THEN 7
              WHEN LOWER("Product"."shortDescription") LIKE '%${searchTerm.replace(/'/g, "''")}%' THEN 8
              WHEN LOWER("Product"."metaTitle") LIKE '%${searchTerm.replace(/'/g, "''")}%' THEN 9
              ELSE 10
            END
          `),
          "ASC"
        ],
        [sequelize.literal('CASE WHEN "Product"."stockQuantity" > 0 THEN 0 ELSE 1 END'), "ASC"],
        ["stockQuantity", "DESC"],
        ["isFeatured", "DESC"],
        ["name", "ASC"]
      ]
    });

    // Process results for intelligent suggestions
    const processedSuggestions = suggestions
      .slice(0, 10) // Limit final results
      .map((product) => {
        // Determine stock status
        const isInStock = product.stockQuantity > 0;
        const isLowStock =
          product.stockQuantity <= product.lowStockThreshold &&
          product.stockQuantity > 0;

        // Determine match context for better UX
        const name = product.name.toLowerCase();
        const sku = (product.sku || "").toLowerCase();
        const tags = product.tags || [];

        let matchContext = "";
        let matchType = "name";

        if (sku === searchTerm || sku.startsWith(searchTerm)) {
          matchContext = `Model: ${product.sku}`;
          matchType = "sku";
        } else if (tags.some((tag) => tag.toLowerCase().includes(searchTerm))) {
          const matchingTag = tags.find((tag) =>
            tag.toLowerCase().includes(searchTerm)
          );
          matchContext = `Tagged: ${matchingTag}`;
          matchType = "tag";
        } else if (product.category) {
          matchContext = `in ${product.category.name}`;
          matchType = "category";
        }

        // Get primary image
        const primaryImage =
          product.images && product.images.length > 0
            ? product.images[0].url
            : null;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          price: parseFloat(product.price),
          comparePrice: product.comparePrice
            ? parseFloat(product.comparePrice)
            : null,
          image: primaryImage,
          shortDescription: product.shortDescription,
          category: product.category ? product.category.name : null,
          categoryId: product.category ? product.category.id : null,
          stockQuantity: product.stockQuantity,
          isInStock,
          isLowStock,
          isFeatured: product.isFeatured,
          tags: product.tags,
          matchContext,
          matchType,
          // Create display text that shows context
          displayText: matchContext
            ? `${product.name} ${matchContext}`
            : product.name,
          // Calculate discount if compare price exists
          discount: product.comparePrice
            ? Math.round(
                ((product.comparePrice - product.price) /
                  product.comparePrice) *
                  100
              )
            : null,
        };
      });

    // Add cache headers for performance
    res.set("Cache-Control", "public, max-age=300"); // 5 minutes

    res.json(processedSuggestions);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        message: "Search query 'q' is required" 
      });
    }

    const searchTerm = q.trim();

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${searchTerm}%` } },
          { lastName: { [Op.iLike]: `%${searchTerm}%` } },
          { email: { [Op.iLike]: `%${searchTerm}%` } },
          { phone: { [Op.iLike]: `%${searchTerm}%` } },
          // Cast ENUM fields to text for ILIKE search
          Sequelize.literal(`"role"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"gender"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          // JSON field searches for address
          Sequelize.literal(`LOWER("address"->>'province') LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')`),
          Sequelize.literal(`LOWER("address"->>'city') LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')`),
          Sequelize.literal(`LOWER("address"->>'fullAddress') LIKE LOWER('%${searchTerm.replace(/'/g, "''")}%')`)
        ]
      },
      attributes: {
        exclude: ['password']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchOrders = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: "Search query 'q' is required" });
  }

  try {
    // Check permissions - admins can search all orders, users only their own
    const isAdmin =
      req.user.role === "admin" &&
      req.user.permissions.includes("manageOrders");

    // Build where clause
    const whereClause = {};

    // User restriction for non-admins
    if (!isAdmin) {
      whereClause.userId = req.user.id;
    }

    // Build include array for associations
    const includeArray = [
      {
        model: OrderItem,
        as: "items",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "slug", "images"],
          },
          {
            model: ProductVariant,
            as: "productVarient",
            attributes: ["id", "name", "attributes"],
          },
        ],
        required: false,
      },
    ];

    // Add User association only for admin users
    if (isAdmin) {
      includeArray.push({
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone"],
        required: false,
      });
    }

    // Search conditions
    const searchConditions = [
      // Search by order ID (convert to string for partial matching)
      sequelize.where(sequelize.cast(sequelize.col("Order.id"), "VARCHAR"), {
        [Op.iLike]: `%${q}%`,
      }),
      // Search in products through order items
      {
        "$items.product.name$": { [Op.iLike]: `%${q}%` },
      },
    ];

    // Add user full name search only for admin users
    if (isAdmin) {
      searchConditions.push(
        // Search for full name combination (firstName + lastName)
        sequelize.where(
          sequelize.fn(
            "CONCAT",
            sequelize.col("user.firstName"),
            " ",
            sequelize.col("user.lastName")
          ),
          { [Op.iLike]: `%${q}%` }
        )
      );
    }

    whereClause[Op.or] = searchConditions;

    // Execute search query
    const orders = await Order.findAll({
      where: whereClause,
      include: includeArray,
      attributes: {
        exclude: [],
      },
      limit: 50,
      order: [["createdAt", "DESC"]],
      distinct: true,
      subQuery: false,
    });

    res.json(orders);
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchCoupons = async (req, res) => {
  try {
    const {q} = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        message: "Search query 'q' is required" 
      });
    }

    const searchTerm = q.trim();


    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: {
        [Op.or]: [
          { code: { [Op.iLike]: `%${searchTerm}%` } },
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
          // Cast ENUM type to text for search
          Sequelize.literal(`"type"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          // Cast numeric fields to text for partial matching
          Sequelize.literal(`"value"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"maxDiscountAmount"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"minimumAmount"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"usageLimit"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"usageLimitPerUser"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"usedCount"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          // Cast boolean fields to text for search
          Sequelize.literal(`"isActive"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"isGlobal"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          // Cast date fields to text for search
          Sequelize.literal(`"startDate"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
          Sequelize.literal(`"endDate"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`)
        ]
      },
    
      order: [['createdAt', 'DESC']]
    });

    

    res.json({
      coupons,
    });

  } catch (error) {
    console.error('Error searching coupons:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchReviews = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        message: "Search query 'q' is required"
      });
    }

    const searchTerm = q.trim();

    // Check permissions - admins can search all reviews, users only their own
    const isAdmin = req.user?.role === "admin" && req.user?.permissions?.includes("manageOrders");

    // Build base where clause
    const whereClause = {};

    // User restriction for non-admins
    if (!isAdmin && req.user?.id) {
      whereClause.userId = req.user.id;
    }

    // Build include array for associations
    const includeArray = [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email", "phone"],
        required: false
      },
      {
        model: Product,
        as: "product", 
        attributes: ["id", "name", "slug", "images"],
        required: false
      },
      {
        model: Order,
        as: "order",
        attributes: ["id", "status", "createdAt"],
        required: false
      }
    ];

    // Search conditions
    whereClause[Op.or] = [
      // Search in review comment
      { comment: { [Op.iLike]: `%${searchTerm}%` } },
      
      // Cast numeric rating to text for partial matching
      Sequelize.literal(`"Review"."rating"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
      
      // Search in user details
      { '$user.firstName$': { [Op.iLike]: `%${searchTerm}%` } },
      { '$user.lastName$': { [Op.iLike]: `%${searchTerm}%` } },
      { '$user.email$': { [Op.iLike]: `%${searchTerm}%` } },
      { '$user.phone$': { [Op.iLike]: `%${searchTerm}%` } },
      
      // Search for full name combination
      Sequelize.literal(`CONCAT("user"."firstName", ' ', "user"."lastName") ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
      
      // Search in product details
      { '$product.name$': { [Op.iLike]: `%${searchTerm}%` } },
      { '$product.slug$': { [Op.iLike]: `%${searchTerm}%` } },
      
      // Cast order status enum to text for search
      Sequelize.literal(`"order"."status"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
      
      // Cast date fields to text for search
      Sequelize.literal(`"Review"."createdAt"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`),
      Sequelize.literal(`"Review"."updatedAt"::text ILIKE '%${searchTerm.replace(/'/g, "''")}%'`)
    ];

    // Execute search query
    const { rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: includeArray,
      order: [['createdAt', 'DESC']],
      distinct: true,
      subQuery: false
    });

    res.json({
      reviews
    });

  } catch (error) {
    console.error('Error searching reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};