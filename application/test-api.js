// Tests simples pour vérifier l'API après migration

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Test des endpoints API...\n');

  // Test 1: Health check des routes d'authentification
  try {
    const response = await fetch(`${baseURL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Route /api/auth/me - Protection fonctionnelle (401 attendu)');
    } else {
      console.log(`❌ Route /api/auth/me - Status inattendu: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test /api/auth/me:', error);
  }

  // Test 2: Route de protection utilisateur
  try {
    const response = await fetch(`${baseURL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ Route /api/user/profile - Protection middleware fonctionnelle (401 attendu)');
    } else {
      console.log(`❌ Route /api/user/profile - Status inattendu: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du test /api/user/profile:', error);
  }

  // Test 3: Structure de réponse des erreurs
  try {
    const response = await fetch(`${baseURL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'invalid',
        password: 'test'
      })
    });
    
    const data = await response.json();
    
    if (data.error && typeof data.message === 'string') {
      console.log('✅ Route /api/auth/signin - Structure d\'erreur conforme');
    } else {
      console.log('❌ Route /api/auth/signin - Structure d\'erreur non conforme');
    }
  } catch (error) {
    console.error('❌ Erreur lors du test /api/auth/signin:', error);
  }

  console.log('\n🏁 Tests terminés');
}

// Exécuter les tests si ce script est appelé directement
if (typeof window === 'undefined') {
  testAPIEndpoints();
}

export { testAPIEndpoints };
