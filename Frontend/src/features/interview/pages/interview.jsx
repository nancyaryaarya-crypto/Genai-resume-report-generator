import React, { useState , useEffect } from 'react'
import "../style/interview.scss"
import { useInterview } from '../hook/useInterview'
import { useNavigate,useParams } from 'react-router'

const Interview = () => {
  const [activeSection, setActiveSection] = useState('technical')
  const { report, getReportById, loading, getResumePdf } = useInterview()
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      getReportById(id)
    }
  }, [id, getReportById])

  if (loading) {
    return (
      <div className="interview-container">
        <p style={{ color: 'white', padding: '20px' }}>Loading your interview preparation data...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="interview-container">
        <p style={{ color: 'white', padding: '20px' }}>Interview report not found. Please select a valid report from the dashboard.</p>
      </div>
    )
  }

  const technicalQuestions = report?.technicalQuestions || report?.technicalQuestion || report?.Questions?.technical || []
  const behavioralQuestions = report?.behavioralQuestions || report?.behavioralQuestion || report?.Questions?.behavioral || []
  const preparationPlan = report?.preparationPlan || report?.roadmap || report?.roadMap || []
  const jobDescription = report?.jobDescription
  const selfDescription = report?.selfDescription
  const reportTitle = report?.title || 'Interview Preparation Plan'

 

  const getSectionData = (section) => {
    switch(section) {
      case 'technical':
        return { title: 'Technical Questions', questions: technicalQuestions }
      case 'behavioral':
        return { title: 'Behavioral Questions', questions: behavioralQuestions }
      case 'roadmap':
        return { title: 'Preparation Road Map', plan: preparationPlan }
      default:
        return { title: '', questions: [] }
    }
  }

  const currentData = getSectionData(activeSection)
  const isRoadmap = activeSection === 'roadmap'

  return (
    <main className='interview-container'>
      <div className='interview-wrapper'>
        
        {/* Left Sidebar - Navigation */}
        <aside className='sidebar-left'>
          <div className='sidebar-content'>
            <div className='sidebar-header'>
              <h3 className='sidebar-title'>Interview Plan</h3>
              <div className='match-score'>
                <span className='score-label'>Match</span>
                <span className='score-value'>{report?.matchScore}%</span>
              </div>
            </div>
            <nav className='nav-menu'>
              <button 
                className={`nav-item ${activeSection === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveSection('technical')}
              >
                <span className='nav-icon'>💻</span>
                <span className='nav-text'>Technical</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'behavioral' ? 'active' : ''}`}
                onClick={() => setActiveSection('behavioral')}
              >
                <span className='nav-icon'>🤝</span>
                <span className='nav-text'>Behavioral</span>
              </button>
              <button 
                className={`nav-item ${activeSection === 'roadmap' ? 'active' : ''}`}
                onClick={() => setActiveSection('roadmap')}
              >
                <span className='nav-icon'>🗺️</span>
                <span className='nav-text'>Road Map</span>
              </button>

              <button 
               onClick={()=> {getResumePdf(id)}}
               className='button primary-button'>
               
               <svg  height={"0.8rem"} style={{merginRight:"0.8rem"}}  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.0007 1.20825 18.3195 3.68108 20.7923 4.99992 18.3195 6.31876 17.0007 8.79159 15.6818 6.31876 13.209 4.99992 15.6818 3.68108 17.0007 1.20825ZM8.00065 4.33325 10.6673 9.33325 15.6673 11.9999 10.6673 14.6666 8.00065 19.6666 5.33398 14.6666.333984 11.9999 5.33398 9.33325 8.00065 4.33325ZM19.6673 16.3333 18.0007 13.2083 16.334 16.3333 13.209 17.9999 16.334 19.6666 18.0007 22.7916 19.6673 19.6666 22.7923 17.9999 19.6673 16.3333Z"></path></svg>
               Download resume
              </button>

            </nav>
          </div>
        </aside>

        {/* Center - Main Content */}
        <section className='main-content'>
          <div className='content-header'>
            <h2 className='section-title'>{currentData.title}</h2>
            <div className='content-meta'>
              {!isRoadmap && <span className='question-count'>{currentData.questions?.length} questions</span>}
              {isRoadmap && <span className='question-count'>{currentData.plan?.length} days</span>}
            </div>
          </div>

          <div className='questions-list'>
            {!isRoadmap ? (
              // Technical & Behavioral Questions
              currentData.questions?.map((q, index) => (
                <div key={q._id || q.id || index} className='question-card'>
                  <div className='question-number'>
                    <span>{index + 1}</span>
                  </div>
                  <div className='question-content'>
                    <p className='question-text'>{q.question}</p>
                    <p className='question-intention'>{q.intention}</p>
                    <div className='question-footer'>
                      <button className='answer-btn'>View Answer</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Road Map Days
              currentData.plan?.map((day, index) => (
                <div key={`day-${index}`} className='roadmap-card'>
                  <div className='day-badge'>
                    <span>Day {day.day}</span>
                  </div>
                  <div className='roadmap-content'>
                    <h3 className='day-focus'>{day.focus}</h3>
                    <ul className='tasks-list'>
                      {day.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className='task-item'>
                          <span className='task-check'>✓</span>
                          <span className='task-text'>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Navigation Buttons */}
          {!isRoadmap && (
            <div className='content-footer'>
              <button className='btn-prev'>← Previous</button>
              <div className='progress-indicator'>
                <span className='progress-text'>Question 1 of {currentData.questions?.length}</span>
              </div>
              <button className='btn-next'>Next →</button>
            </div>
          )}
        </section>

        {/* Right Sidebar - Skill Gaps */}
        <aside className='sidebar-right'>
          <div className='sidebar-content'>
            <h3 className='sidebar-title'>
              <span className='title-icon'>⚠️</span>
              Skill Gaps
            </h3>
            <div className='skills-container'>
              {report?.skillGap?.map((skill) => (
                <div key={skill.id || skill._id} className={`skill-badge skill-${skill.severity?.toLowerCase() || "low"}`}>
                  <div className='skill-info'>
                    <span className='skill-name'>{skill.skill}</span>
                  </div>
                  <span className='skill-severity'>{skill.severity}</span>
                </div>
              ))}
            </div>

            <div className='improvement-tips'>
              <h4 className='tips-title'>💡 Focus Areas</h4>
              <ul className='tips-list'>
                <li>Deep dive into MERN stack fundamentals</li>
                <li>Practice building production-ready applications</li>
                <li>Master JavaScript ES6+ features</li>
                <li>Learn testing frameworks and best practices</li>
                <li>Study system design patterns</li>
              </ul>
            </div>
          </div>
        </aside>

      </div>
    </main>
  )
}

export default Interview
