import { useState } from 'react'

function Predictor() {
    const [formData, setFormData] = useState({
        ssc_percentage: 75,
        hsc_percentage: 75,
        degree_percentage: 70,
        cgpa: 7.5,
        entrance_exam_score: 70,
        technical_skill_score: 70,
        soft_skill_score: 70,
        internship_count: 1,
        live_projects: 1,
        work_experience_months: 0,
        certifications: 2,
        attendance_percentage: 85,
        backlogs: 0,
        gender: 'Male',
        extracurricular_activities: 'Yes'
    })

    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Prediction failed')

            const data = await response.json()
            setResult(analyzeResult(data))
        } catch (error) {
            console.error('Error:', error)
            const localResult = makePrediction(formData)
            setResult(localResult)
        } finally {
            setLoading(false)
        }
    }

    const analyzeResult = (data) => {
        const prob = data.probability || 50
        return {
            ...data,
            tier: getTier(prob),
            tierInfo: getTierInfo(prob),
            percentile: getPercentile(prob)
        }
    }

    const getTier = (prob) => {
        if (prob >= 80) return 'excellent'
        if (prob >= 60) return 'good'
        if (prob >= 40) return 'moderate'
        if (prob >= 20) return 'low'
        return 'critical'
    }

    const getTierInfo = (prob) => {
        if (prob >= 80) return {
            label: 'Excellent Chances',
            icon: '🌟',
            color: '#10b981',
            message: 'Your profile is among the top candidates. Keep up the great work!'
        }
        if (prob >= 60) return {
            label: 'Good Chances',
            icon: '✅',
            color: '#22c55e',
            message: 'You have solid fundamentals. A few improvements can boost your chances further.'
        }
        if (prob >= 40) return {
            label: 'Moderate Chances',
            icon: '⚠️',
            color: '#f59e0b',
            message: 'Your profile has potential but needs work in key areas to compete effectively.'
        }
        if (prob >= 20) return {
            label: 'Needs Improvement',
            icon: '📉',
            color: '#ef4444',
            message: 'Focus on addressing critical gaps. Targeted improvements can significantly help.'
        }
        return {
            label: 'Critical Gaps',
            icon: '🚨',
            color: '#dc2626',
            message: 'Immediate action needed on fundamental requirements before placement season.'
        }
    }

    const getPercentile = (prob) => {
        if (prob >= 80) return 'Top 5%'
        if (prob >= 60) return 'Top 15%'
        if (prob >= 40) return 'Top 35%'
        if (prob >= 20) return 'Top 60%'
        return 'Bottom 40%'
    }

    // Prediction logic with STRONGER weights for critical factors
    // Critical factors (Backlogs, Tech Skills, CGPA) should heavily impact score
    const makePrediction = (data) => {
        const suggestions = []
        const strengths = []

        // Ensure all values are numbers (form values might be strings)
        const cgpa = parseFloat(data.cgpa) || 0
        const techSkill = parseInt(data.technical_skill_score) || 0
        const softSkill = parseInt(data.soft_skill_score) || 0

        // Track critical issues that should cap the score
        let hasCriticalIssue = false
        let criticalPenalty = 0

        // ==========================================
        // BACKLOGS - Most Important Factor (35% weight)
        // Dataset: NO student with >2 backlogs got placed
        // ==========================================
        let backlogScore = 0
        const backlogs = parseInt(data.backlogs) || 0  // Ensure numeric comparison

        if (backlogs === 0) {
            backlogScore = 35
            strengths.push('No backlogs - excellent academic standing')
        } else if (backlogs === 1) {
            backlogScore = 20
            suggestions.push({
                area: 'Backlogs',
                priority: 'High',
                message: '1 backlog detected. Clearing it will improve your placement chances.',
                impact: 'High'
            })
        } else if (backlogs === 2) {
            backlogScore = 10
            suggestions.push({
                area: 'Backlogs',
                priority: 'High',
                message: '2 backlogs detected. This significantly reduces placement chances. Clear them soon.',
                impact: 'High'
            })
        } else {
            // >2 backlogs = CRITICAL - should cap score very low
            backlogScore = 0
            hasCriticalIssue = true
            criticalPenalty += 40
            suggestions.push({
                area: 'Backlogs',
                priority: 'Critical',
                message: `${backlogs} backlogs is a major barrier. No student with >2 backlogs got placed. Clear these immediately.`,
                impact: 'Critical'
            })
        }

        // ==========================================
        // TECHNICAL SKILLS - Critical Factor (30% weight)
        // Dataset: NO student with <50 tech skills got placed
        // ==========================================
        let techScore = 0
        if (techSkill >= 80) {
            techScore = 30
            strengths.push(`Strong technical skills (${techSkill}/100)`)
        } else if (techSkill >= 70) {
            techScore = 25
            strengths.push(`Good technical skills (${techSkill}/100)`)
        } else if (techSkill >= 60) {
            techScore = 18
            suggestions.push({
                area: 'Technical Skills',
                priority: 'Medium',
                message: 'Improve technical skills to 70+ through coding practice and online courses.',
                impact: 'High'
            })
        } else if (techSkill >= 50) {
            techScore = 10
            suggestions.push({
                area: 'Technical Skills',
                priority: 'High',
                message: 'Technical score is borderline. Focus intensively on DSA, coding, and technical prep.',
                impact: 'High'
            })
        } else {
            // <50 tech skills = CRITICAL
            techScore = 0
            hasCriticalIssue = true
            criticalPenalty += 35
            suggestions.push({
                area: 'Technical Skills',
                priority: 'Critical',
                message: `Technical score of ${techSkill} is below 50. No student with this score got placed.`,
                impact: 'Critical'
            })
        }

        // ==========================================
        // CGPA - Critical Factor (25% weight)
        // Dataset: NO student with <7.0 CGPA got placed
        // ==========================================
        let cgpaScore = 0
        if (cgpa >= 8.5) {
            cgpaScore = 25
            strengths.push(`Excellent CGPA (${cgpa})`)
        } else if (cgpa >= 8.0) {
            cgpaScore = 22
            strengths.push(`Strong CGPA (${cgpa})`)
        } else if (cgpa >= 7.5) {
            cgpaScore = 18
        } else if (cgpa >= 7.0) {
            cgpaScore = 12
            suggestions.push({
                area: 'CGPA',
                priority: 'Medium',
                message: 'CGPA is above minimum but could be stronger. Focus on improving grades.',
                impact: 'Medium'
            })
        } else {
            // <7.0 CGPA = CRITICAL
            cgpaScore = 0
            hasCriticalIssue = true
            criticalPenalty += 30
            suggestions.push({
                area: 'CGPA',
                priority: 'Critical',
                message: `CGPA of ${cgpa} is below 7.0. No student below this threshold got placed.`,
                impact: 'Critical'
            })
        }

        // ==========================================
        // SOFT SKILLS (10% weight)
        // ==========================================
        let softScore = 0
        if (softSkill >= 80) {
            softScore = 10
            strengths.push(`Excellent soft skills (${softSkill}/100)`)
        } else if (softSkill >= 60) {
            softScore = 7
        } else if (softSkill >= 50) {
            softScore = 4
            suggestions.push({
                area: 'Soft Skills',
                priority: 'Medium',
                message: 'Develop communication and interpersonal skills through presentations and group activities.',
                impact: 'Medium'
            })
        } else {
            softScore = 0
            criticalPenalty += 10
            suggestions.push({
                area: 'Soft Skills',
                priority: 'High',
                message: 'Soft skills below 50 significantly reduce placement chances. Focus on communication training.',
                impact: 'High'
            })
        }

        // ==========================================
        // Calculate Final Score
        // ==========================================
        let totalScore = backlogScore + techScore + cgpaScore + softScore

        // Apply critical penalty - if any critical issue exists, SEVERELY cap the score
        // Critical issues should result in "Needs Improvement" or lower tiers
        if (hasCriticalIssue) {
            // Each critical issue caps the max possible score
            // Single critical: max 35, Two critical: max 25, Three+: max 15
            const maxScoreForCritical = Math.max(35 - (criticalPenalty * 0.3), 10)
            totalScore = Math.min(totalScore, maxScoreForCritical)
        }

        // Cap between 5 and 95
        const probability = Math.min(Math.max(Math.round(totalScore), 5), 95)

        const prediction = probability >= 50 ? 'Placed' : 'Not Placed'

        return {
            prediction,
            probability,
            tier: getTier(probability),
            tierInfo: getTierInfo(probability),
            percentile: getPercentile(probability),
            suggestions,
            strengths
        }
    }

    return (
        <section id="predictor">
            <div className="section-header">
                <h2>Live Placement Predictor</h2>
                <p>
                    Enter your academic details below to see your placement readiness score and personalized recommendations.
                </p>
            </div>

            <div className="predictor-container">
                <form className="predictor-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* CGPA with Slider */}
                        <div className="form-group">
                            <label>CGPA (out of 10)</label>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    name="cgpa"
                                    min="4"
                                    max="10"
                                    step="0.1"
                                    value={formData.cgpa}
                                    onChange={handleChange}
                                />
                                <span className="slider-value">{formData.cgpa}</span>
                            </div>
                        </div>

                        {/* SSC Percentage */}
                        <div className="form-group">
                            <label>SSC Percentage (10th %)</label>
                            <input
                                type="number"
                                name="ssc_percentage"
                                value={formData.ssc_percentage}
                                onChange={handleChange}
                                min="0" max="100"
                                placeholder="Enter SSC %"
                            />
                        </div>

                        {/* HSC Percentage */}
                        <div className="form-group">
                            <label>HSC Percentage (12th %)</label>
                            <input
                                type="number"
                                name="hsc_percentage"
                                value={formData.hsc_percentage}
                                onChange={handleChange}
                                min="0" max="100"
                                placeholder="Enter HSC %"
                            />
                        </div>


                        {/* Technical Skills */}
                        <div className="form-group">
                            <label>Technical Skill Score (1-100)</label>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    name="technical_skill_score"
                                    min="1"
                                    max="100"
                                    value={formData.technical_skill_score}
                                    onChange={handleChange}
                                />
                                <span className="slider-value">{formData.technical_skill_score}</span>
                            </div>
                        </div>

                        {/* Soft Skills */}
                        <div className="form-group">
                            <label>Soft Skill Score (1-100)</label>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    name="soft_skill_score"
                                    min="1"
                                    max="100"
                                    value={formData.soft_skill_score}
                                    onChange={handleChange}
                                />
                                <span className="slider-value">{formData.soft_skill_score}</span>
                            </div>
                        </div>

                        {/* Internships */}
                        <div className="form-group">
                            <label>Number of Internships</label>
                            <select name="internship_count" value={formData.internship_count} onChange={handleChange}>
                                <option value={0}>0 - None</option>
                                <option value={1}>1 Internship</option>
                                <option value={2}>2 Internships</option>
                                <option value={3}>3 Internships</option>
                                <option value={4}>4+ Internships</option>
                            </select>
                        </div>

                        {/* Live Projects */}
                        <div className="form-group">
                            <label>Live Projects</label>
                            <select name="live_projects" value={formData.live_projects} onChange={handleChange}>
                                <option value={0}>0 - None</option>
                                <option value={1}>1 Project</option>
                                <option value={2}>2 Projects</option>
                                <option value={3}>3+ Projects</option>
                            </select>
                        </div>

                        {/* Work Experience */}
                        <div className="form-group">
                            <label>Work Experience (months)</label>
                            <input
                                type="number"
                                name="work_experience_months"
                                value={formData.work_experience_months}
                                onChange={handleChange}
                                min="0" max="60"
                                placeholder="Enter months"
                            />
                        </div>

                        {/* Certifications */}
                        <div className="form-group">
                            <label>Certifications</label>
                            <select name="certifications" value={formData.certifications} onChange={handleChange}>
                                <option value={0}>0 - None</option>
                                <option value={1}>1 Certification</option>
                                <option value={2}>2 Certifications</option>
                                <option value={3}>3 Certifications</option>
                                <option value={4}>4 Certifications</option>
                                <option value={5}>5+ Certifications</option>
                            </select>
                        </div>

                        {/* Attendance */}
                        <div className="form-group">
                            <label>Attendance Percentage</label>
                            <div className="slider-container">
                                <input
                                    type="range"
                                    name="attendance_percentage"
                                    min="40"
                                    max="100"
                                    value={formData.attendance_percentage}
                                    onChange={handleChange}
                                />
                                <span className="slider-value">{formData.attendance_percentage}%</span>
                            </div>
                        </div>

                        {/* Backlogs */}
                        <div className="form-group">
                            <label>Number of Backlogs</label>
                            <select name="backlogs" value={formData.backlogs} onChange={handleChange}>
                                <option value={0}>0 - None ✅</option>
                                <option value={1}>1 Backlog</option>
                                <option value={2}>2 Backlogs</option>
                                <option value={3}>3 Backlogs ⚠️</option>
                                <option value={4}>4 Backlogs ⚠️</option>
                                <option value={5}>5+ Backlogs 🚨</option>
                            </select>
                        </div>

                        {/* Gender */}
                        <div className="form-group">
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        {/* Extracurricular */}
                        <div className="form-group">
                            <label>Extracurricular Activities</label>
                            <select name="extracurricular_activities" value={formData.extracurricular_activities} onChange={handleChange}>
                                <option value="Yes">Yes - Active</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                        {loading ? (
                            <span className="loading">
                                <span className="spinner"></span>
                                Analyzing...
                            </span>
                        ) : (
                            <>📊 Analyze My Profile</>
                        )}
                    </button>
                </form>

                {/* Results Section */}
                {result && (
                    <div className="result-container">
                        <div className="result-card" style={{ borderColor: result.tierInfo?.color }}>
                            {/* Readiness Score Header */}
                            <div className="score-header">
                                <div className="score-circle" style={{
                                    background: `conic-gradient(${result.tierInfo?.color} ${result.probability * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
                                }}>
                                    <div className="score-inner">
                                        <span className="score-value">{result.probability}</span>
                                        <span className="score-label">/ 100</span>
                                    </div>
                                </div>
                                <div className="score-info">
                                    <div className="tier-badge" style={{ background: result.tierInfo?.color }}>
                                        {result.tierInfo?.icon} {result.tierInfo?.label}
                                    </div>
                                    <p className="tier-message">{result.tierInfo?.message}</p>
                                    <p className="percentile">
                                        Your profile is in the <strong>{result.percentile}</strong> of candidates
                                    </p>
                                </div>
                            </div>

                            {/* Strengths */}
                            {result.strengths && result.strengths.length > 0 && (
                                <>
                                    <h4 style={{ marginTop: '25px', marginBottom: '15px', textAlign: 'left' }}>
                                        ✨ Your Strengths ({result.strengths.length})
                                    </h4>
                                    <div className="strengths-grid">
                                        {result.strengths.map((strength, idx) => (
                                            <div className="strength-item" key={idx}>
                                                <span className="icon">✓</span>
                                                <span>{strength}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Suggestions */}
                            {result.suggestions && result.suggestions.length > 0 && (
                                <>
                                    <h4 style={{ marginTop: '25px', marginBottom: '15px', textAlign: 'left' }}>
                                        📋 Areas to Improve ({result.suggestions.length})
                                    </h4>
                                    <div className="suggestions-grid">
                                        {result.suggestions
                                            .sort((a, b) => {
                                                const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 }
                                                return order[a.priority] - order[b.priority]
                                            })
                                            .map((suggestion, idx) => (
                                                <div className="suggestion-item" key={idx}>
                                                    <span className={`priority ${suggestion.priority.toLowerCase()}`}>
                                                        {suggestion.priority}
                                                    </span>
                                                    <div className="suggestion-content">
                                                        <h4>{suggestion.area}</h4>
                                                        <p>{suggestion.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Predictor
