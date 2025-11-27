"use client";
import React, { useState, useEffect } from "react";


export default function ProductList () {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchProducts = async () => {
        try {
            const response = await fetch('/api/vendor/products');
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
        };
    
        fetchProducts();
    }, []);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return (
        <div>
        <h1>Product List</h1>
        <ul>
            {products.map(product => (
            <li key={product.id}>{product.name}</li>
            ))}
        </ul>
        </div>
    );
}
