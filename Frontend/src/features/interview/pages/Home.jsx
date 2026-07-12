import React ,  { useState,useRef,useEffect}from 'react'
import "../style/home.scss"
import { useInterview } from '../hook/useInterview'
import { useNavigate } from 'react-router'

const Home = () => {

     const {loading, generateReport, reports, getReports} = useInterview()
     const [jobDescription, setJobDescription] = useState("")
     const [selfDescription,setSelfDescription] = useState("")
     const resumeInputRef = useRef()

     const navigate = useNavigate()

    useEffect(() => {
       getReports()
    }, []);

     const handleGenerateReport = async () =>{
        const resumeFile = resumeInputRef.current.files[0]
        const data = await generateReport ({ jobDescription, selfDescription, resumeFile})

        if (data?._id) {
          navigate(`/interview/${data._id}`)
        }
     }


    if(loading) {
      return (
        <main className=" loading-Screen">
          <h1>Loading your interview plan </h1>
        </main>
      )
    }

return (
    <main className='home'>
      <div className='home-container'>
        {/* Header Section */}
        <header className='home-header'>
          <h1>
            Create Your Custom <span className='highlight-text'>Interview</span> <span className='highlight-plan'>Plan</span>
          </h1>
          <p className='subtitle'>Let our AI analyze the job requirements and your unique profile to build a winning strategy</p>
        </header>

        {/* Main Content */}
        <div className='interview-input-group'>
          {/* Left Section - Job Description */}
          <div className='left-section'>
            <div className='section-header'>
              <span className='icon'>🎯</span>
              <h2>Target Job Description</h2>
              <span className='required'>Required</span>
            </div>
            <textarea 
              onChange={(e)=>setJobDescription(e.target.value)}
              name="jobDescription" 
              id="jobDescription" 
              placeholder='Paste the full job description here...&#10;e.g., "Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design..."'
              className='job-description-textarea'
            ></textarea>
            <p className='char-count'>0 / 5000 chars</p>
          </div>

          {/* Right Section - Profile */}
          <div className='right-section'>
            {/* Resume Upload */}
            <div className='profile-section'>
              <div className='section-header'>
                <span className='icon'>👤</span>
                <h2>Your Profile</h2>
              </div>

              <div className='resume-upload' onClick={()=>resumeInputRef.current.click()}>
                <p className='upload-label'>Upload Resume <span className='required'>Note: Resume</span></p>
                <div className='upload-box'>
                  <span className='upload-icon'>📁</span>
                  <p className='upload-text'>Click to upload or drag & drop</p>
                  <p className='upload-subtext'>PDF or DOCX (Max 5MB)</p>
                </div>
                <input 
                  ref={resumeInputRef}
                  hidden 
                  type="file" 
                  name="resume" 
                  id="resume" 
                  accept=".pdf,.docx"
                ></input>
              </div>

              {/* OR Divider */}
              <div className='or-divider'>
                <span>OR</span>
              </div>

              {/* Self Description */}
              <div className='self-description-group'>
                <label htmlFor='selfDescription' className='description-label'>Quick Self-Description</label>
                <textarea 
                  onChange={(e)=>{setSelfDescription(e.target.value)}}
                  name="selfDescription" 
                  id="selfDescription" 
                  placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                  className='self-description-textarea'
                ></textarea>
              </div>

              {/* Info Message */}
              <div className='info-message'>
                <span className='info-icon'>ℹ️</span>
                <p>Either a Resume or a Self Description is required to generate a personalized plan.</p>
              </div>

              {/* Generate Button */}
              <button onClick = {handleGenerateReport} className='generate-button'>
                <span className='button-icon'>✨</span>
                Generate My Interview Strategy
              </button>
            </div>
          </div>
        </div>
        {/* recent reports list*/}
      
        {reports && reports.length > 0 && (
        <section className='recent-reports'>
            <h2>My Recent Interview Plans</h2>
          <ul className='reports-list'>
            {reports.map((report) => (
            <li 
              key={report._id} 
              className='report-item' 
               onClick={() => navigate(`/interview/${report._id}`)}
            >
              <h3>{report.title || 'Untitled Position'}</h3>
              <p className='report-meta'>
                Generated on {new Date(report.createdAt).toLocaleString()}
              </p>
              <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score-low'}`}>
                 Match Score :{ report.matchScore}%
              </p>
            </li>
           ))}
          </ul>
        </section>
       )}
        

        {/* Footer */}
        <footer className='home-footer'>
          <a href='#privacy'>Privacy Policy</a>
          <span className='separator'>•</span>
          <a href='#terms'>Terms of Service</a>
          <span className='separator'>•</span>
          <a href='#help'>Help Center</a>
        </footer>
      </div>
    </main>
  )
}

export default Home
