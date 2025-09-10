/**
 * Script de test pour le système de recherche Typesense
 * Usage: node test-search.js
 */

const axios = require('axios')

const BASE_URL = 'http://localhost:3333'
const API_KEY = 'xyz' // Remplacer par votre clé API si nécessaire

// Configuration des tests
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/opened/search/health',
    expected: 200
  },
  {
    name: 'Autocomplétion - "laptop"',
    method: 'GET',
    url: '/opened/search/autocomplete?q=laptop',
    expected: 200
  },
  {
    name: 'Recherche globale - "ordinateur"',
    method: 'GET',
    url: '/opened/search?q=ordinateur&limit=10',
    expected: 200
  },
  {
    name: 'Recherche produits avec filtres',
    method: 'GET',
    url: '/opened/search/products?q=laptop&min_price=500&max_price=2000&page=1&per_page=5',
    expected: 200
  },
  {
    name: 'Recherche catégories',
    method: 'GET',
    url: '/opened/search/categories?q=électronique',
    expected: 200
  },
  {
    name: 'Recherche marques',
    method: 'GET',
    url: '/opened/search/brands?q=apple',
    expected: 200
  },
  {
    name: 'Recherche vide (doit échouer)',
    method: 'GET',
    url: '/opened/search/autocomplete?q=a',
    expected: 200,
    expectEmpty: true
  }
]

async function runTest(test) {
  try {
    console.log(`\n🧪 Test: ${test.name}`)
    console.log(`   ${test.method} ${test.url}`)
    
    const response = await axios({
      method: test.method,
      url: BASE_URL + test.url,
      timeout: 5000
    })
    
    const success = response.status === test.expected
    console.log(`   Status: ${response.status} ${success ? '✅' : '❌'}`)
    
    if (response.data) {
      const data = response.data.data || response.data
      
      if (test.expectEmpty) {
        const isEmpty = !data || (data.results && data.results.every(r => r.hits.length === 0))
        console.log(`   Empty result: ${isEmpty ? '✅' : '❌'}`)
      } else {
        // Afficher des informations sur les résultats
        if (data.results) {
          // Multi-search (autocomplétion/recherche globale)
          const totalHits = data.results.reduce((sum, result) => sum + result.hits.length, 0)
          console.log(`   Results: ${totalHits} hits across ${data.results.length} collections`)
          
          data.results.forEach(result => {
            if (result.hits.length > 0) {
              console.log(`     ${result.collection}: ${result.hits.length} hits`)
            }
          })
        } else if (data.hits) {
          // Single collection search
          console.log(`   Results: ${data.hits.length} hits (${data.found} total found)`)
          
          // Afficher les premiers résultats
          data.hits.slice(0, 3).forEach((hit, index) => {
            const doc = hit.document
            console.log(`     ${index + 1}. ${doc.name} (score: ${hit.text_match})`)
          })
        } else if (data.ok !== undefined) {
          // Health check
          console.log(`   Health: ${data.ok ? '✅ OK' : '❌ Error'}`)
        }
      }
    }
    
    return { success: true, test: test.name }
  } catch (error) {
    console.log(`   Error: ${error.message} ❌`)
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Message: ${error.response.data?.message || 'Unknown error'}`)
    }
    
    return { success: false, test: test.name, error: error.message }
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests du système de recherche Typesense')
  console.log(`📍 Base URL: ${BASE_URL}`)
  
  const results = []
  
  for (const test of tests) {
    const result = await runTest(test)
    results.push(result)
    
    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Résumé
  console.log('\n📊 Résumé des tests:')
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`   ✅ Réussis: ${successful}/${results.length}`)
  console.log(`   ❌ Échoués: ${failed}/${results.length}`)
  
  if (failed > 0) {
    console.log('\n❌ Tests échoués:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.test}: ${r.error}`)
    })
  }
  
  if (successful === results.length) {
    console.log('\n🎉 Tous les tests sont passés! Le système de recherche fonctionne correctement.')
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration Typesense.')
  }
}

// Démarrer les tests
runAllTests().catch(error => {
  console.error('💥 Erreur fatale lors des tests:', error.message)
  process.exit(1)
})
