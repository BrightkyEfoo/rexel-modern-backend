const axios = require('axios');

async function testSimilarProducts() {
  try {
    console.log('Testing similar products API...');
    
    // D'abord, récupérer un produit existant
    const productsResponse = await axios.get('http://localhost:3333/api/v1/opened/products');
    console.log('Products response status:', productsResponse.status);
    
    if (productsResponse.data.data && productsResponse.data.data.length > 0) {
      const firstProduct = productsResponse.data.data[0];
      console.log('Testing with product:', firstProduct.slug);
      
      // Tester l'API des produits similaires
      const similarResponse = await axios.get(`http://localhost:3333/api/v1/opened/products/${firstProduct.slug}/similar`);
      console.log('Similar products response status:', similarResponse.status);
      console.log('Similar products count:', similarResponse.data.data.length);
      console.log('Similar products:', similarResponse.data.data.map(p => ({ id: p.id, name: p.name })));
    } else {
      console.log('No products found to test with');
    }
  } catch (error) {
    console.error('Error testing similar products API:', error.response?.data || error.message);
  }
}

testSimilarProducts(); 