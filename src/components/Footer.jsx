function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <h3>PlacementAI</h3>
                <p>
                    Built with Machine Learning to help students predict and improve their placement chances.
                    Trained on real student data for accurate, personalized predictions.
                </p>
                <div className="footer-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#predictor">Predictor</a>
                    <a href="https://kaggle.com" target="_blank" rel="noopener noreferrer">Dataset</a>
                </div>
                <p style={{ marginTop: '30px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                    © 2024 PlacementAI. All rights reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer
