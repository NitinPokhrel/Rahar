import Image from 'next/image';

const ProductList = ({ products }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="border p-4">
          <div className="relative h-64">
            <Image 
              src={product.image} 
              alt={product.name} 
              layout="fill" 
              objectFit="cover" 
              priority={false} 
            />
          </div>
          <h3 className="mt-2">{product.name}</h3>
          <p className="text-gray-600">{product.price}</p>
          <p className="text-yellow-400">Rating: {product.rating}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
