import { useState, useEffect } from 'react'
import Hero from './components/Hero'
import About from './components/About'
import EDASection from './components/EDASection'
import ModelInfo from './components/ModelInfo'
import Predictor from './components/Predictor'
import Footer from './components/Footer'

function App() {
    const [modelInfo, setModelInfo] = useState(null)

    useEffect(() => {
        // Load model info from JSON file
        fetch('/model_info.json')
            .then(res => res.json())
            .then(data => setModelInfo(data))
            .catch(err => console.log('Model info will be loaded from API'))
    }, [])

    return (
        <div className="app">
            {/* Navigation */}
            <nav className="navbar">
                <div className="logo">PlacementAI</div>
                <ul className="nav-links">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#eda">Analytics</a></li>
                    <li><a href="#model">Model</a></li>
                    <li><a href="#predictor">Predict</a></li>
                </ul>
            </nav>

            {/* Sections */}
            <Hero />
            <About />
            <EDASection />
            <ModelInfo modelInfo={modelInfo} />
            <Predictor />
            <Footer />
        </div>
    )
}

export default App
