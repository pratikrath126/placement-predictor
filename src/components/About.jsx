function About() {
    const features = [
        {
            icon: '🎓',
            title: 'Academic Analysis',
            description: 'Comprehensive analysis of your academic performance including CGPA, percentages, and entrance exam scores.'
        },
        {
            icon: '💻',
            title: 'Skill Assessment',
            description: 'Evaluates technical and soft skills to determine your industry readiness and placement potential.'
        },
        {
            icon: '📈',
            title: 'Data-Driven Insights',
            description: 'Built on 5,000+ student records with proven patterns and success indicators.'
        },
        {
            icon: '🤖',
            title: 'ML Predictions',
            description: 'SVM algorithm with 94.3% accuracy on test data for reliable predictions.'
        },
        {
            icon: '💡',
            title: 'Smart Suggestions',
            description: 'Personalized improvement recommendations based on identified weak areas.'
        },
        {
            icon: '📊',
            title: 'Visual Analytics',
            description: 'Interactive visualizations showing key factors affecting placement success.'
        }
    ]

    return (
        <section id="about">
            <div className="section-header">
                <h2>About This Project</h2>
                <p>
                    A comprehensive placement prediction system using machine learning to help students
                    understand and improve their chances of getting placed.
                </p>
            </div>
            <div className="about-grid">
                {features.map((feature, index) => (
                    <div className="about-card" key={index}>
                        <div className="icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default About
