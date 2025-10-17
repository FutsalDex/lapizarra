import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold break-words">LaPizarra</h1>
        <ul className="flex space-x-4 list-none"> {/* list-none para no bullets */}
          <li><a href="#" className="hover:underline">Ver ejercicios</a></li>
          <li><a href="#" className="hover:underline">Crear sesión</a></li>
          <li><a href="#" className="hover:underline">Mi equipo</a></li>
          <li><a href="#" className="hover:underline">Favoritos</a></li>
          <li><a href="#" className="hover:underline">Panel Admin</a></li>
        </ul>
        <div className="flex items-center space-x-2">
          <span className="text-sm">👤</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="p-8 text-center">
        <h2 className="text-4xl font-bold mb-4 break-words">LaPizarra</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto break-words">
          Tu compañero definitivo para el entrenamiento de fútbol sala. Descubre cientos de ejercicios, diseña sesiones de entrenamientos, gestiona tu equipo y analiza su rendimiento.
        </p>
      </main>

      {/* Cards */}
      <section className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
          <h3 className="text-2xl font-bold mb-4 text-green-600 break-words">¡Potencia Tu Entrenamiento!</h3>
          <p className="mb-4 break-words">Suscríbete a uno de nuestros planes para acceder al catálogo completo de ejercicios y desbloquear las herramientas avanzadas de gestión de equipos.</p>
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Ver Planes →
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
          <h3 className="text-2xl font-bold mb-4 text-green-600 break-words">Acceso de Invitado</h3>
          <p className="mb-4 break-words">¿Quieres probar antes de suscribirte? Como invitado, puedes: Explorar una selección de 15 ejercicios de nuestra biblioteca. Navegar y visualizar todas las herramientas que te ofrecemos. Regístrate y obtén 30 días gratis con acceso a todas las funcionalidades.</p>
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Regístrate Gratis
          </button>
        </div>
      </section>

      {/* Contador HMR */}
      <div className="card text-center p-4">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p className="read-the-docs">
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; 2025 LaPizarra. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}

export default App
