import { useEffect, useRef } from 'react'

function Hero() {
    const particlesRef = useRef(null)

    useEffect(() => {
        // Create floating particles
        const container = particlesRef.current
        if (!container) return

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div')
            particle.className = 'particle'
            particle.style.left = `${Math.random() * 100}%`
            particle.style.animationDelay = `${Math.random() * 15}s`
            particle.style.animationDuration = `${15 + Math.random() * 10}s`
            container.appendChild(particle)
        }

        return () => {
            container.innerHTML = ''
        }
    }, [])

    return (
        <section id="home" className="hero">
            <div className="particles" ref={particlesRef}></div>
            <div className="hero-content">
                <div className="hero-badge">
                    <span>✨</span> AI-Powered Predictions
                </div>
                <h1>
                    Predict Your <span className="gradient-text">Placement Success</span>
                </h1>
                <p>
                    Advanced machine learning models analyze your academic profile to predict placement outcomes
                    and provide personalized suggestions to boost your career prospects.
                </p>
                <div className="hero-buttons">
                    <a href="#predictor" className="btn btn-primary">
                        🎯 Start Prediction
                    </a>
                    <a href="#about" className="btn btn-secondary">
                        📊 Learn More
                    </a>
                </div>
            </div>
        </section>
    )
}

export default Hero
