import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'

type Screen = 'welcome' | 'details' | 'camera' | 'quiz' | 'result' | 'certificate'

type Question = {
  prompt: string
  answers: string[]
  correctAnswer: string
  explanation: string
}

const quizQuestions: Question[] = [
  {
    prompt: 'What should we do with plastic bottles after using them?',
    answers: ['Throw them anywhere', 'Recycle them', 'Burn them', 'Leave them outside'],
    correctAnswer: 'Recycle them',
    explanation: 'Recycling turns used plastic into new materials and helps keep parks, rivers and oceans clean.',
  },
  {
    prompt: 'Why is saving water important?',
    answers: ['Because clean water is limited', 'Because water has no use', 'Because taps like running all day', 'Because rain never stops'],
    correctAnswer: 'Because clean water is limited',
    explanation: 'Fresh clean water is precious. Saving water means there is more for people, nature and future generations.',
  },
  {
    prompt: 'What does recycling help reduce?',
    answers: ['Waste', 'Trees', 'Clean air', 'Sunlight'],
    correctAnswer: 'Waste',
    explanation: 'Recycling reduces rubbish going to landfill and gives materials another useful life.',
  },
  {
    prompt: 'Which one is better for the planet?',
    answers: ['Using a reusable bottle', 'Using a new plastic bottle every time', 'Throwing bottles away', 'Leaving rubbish on the ground'],
    correctAnswer: 'Using a reusable bottle',
    explanation: 'Reusable bottles cut single-use plastic waste and save resources used for making new bottles.',
  },
  {
    prompt: 'What can businesses do to help the planet?',
    answers: ['Measure and reduce their carbon emissions', 'Ignore waste', 'Use more packaging', 'Waste more energy'],
    correctAnswer: 'Measure and reduce their carbon emissions',
    explanation: 'Tracking emissions helps businesses improve energy use and lower pollution over time.',
  },
]

const getBadge = (score: number) => {
  if (score === 100) return 'Eco Champion'
  if (score >= 60) return 'Eco Explorer'
  if (score >= 20) return 'Planet Learner'
  return 'New Eco Starter'
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [name, setName] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [dayCounter, setDayCounter] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)
  const [finishedCounted, setFinishedCounted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const certificateRef = useRef<HTMLDivElement>(null)

  const activeQuestion = quizQuestions[currentQuestionIndex]
  const progressPercent = ((currentQuestionIndex + 1) / quizQuestions.length) * 100
  const badge = getBadge(score)

  const encouragementMessage = useMemo(() => {
    if (score === 100) return 'Amazing work. You are a SustainZone Eco Champion.'
    if (score >= 60) return 'Great job. You are a SustainZone Eco Explorer.'
    if (score >= 20) return 'Good effort. You are learning how to help the planet.'
    return 'Well done for taking part. Every Eco Explorer starts by learning.'
  }, [score])

  useEffect(() => {
    if (screen === 'result' || screen === 'certificate') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2600)
      return () => clearTimeout(timer)
    }
  }, [screen])

  const startCamera = async () => {
    try {
      setCameraError(false)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError(true)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const goToCameraScreen = async () => {
    setScreen('camera')
    await startCamera()
  }

  const takePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    setPhoto(canvas.toDataURL('image/png'))
    stopCamera()
  }

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return
    const correct = answer === activeQuestion.correctAnswer
    setSelectedAnswer(answer)
    setIsCorrect(correct)
    if (correct) setScore((prev) => prev + 20)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } else {
      setScreen('result')
      if (!finishedCounted) {
        setDayCounter((prev) => prev + 1)
        setFinishedCounted(true)
      }
    }
  }

  const resetChallenge = () => {
    stopCamera()
    setScreen('welcome')
    setName('')
    setConsentGiven(false)
    setPhoto(null)
    setCameraError(false)
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setFinishedCounted(false)
  }

  const certificateNumber = `SZ-ECO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}`

  const downloadCertificate = async () => {
    if (!certificateRef.current) return
    const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true })
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `${name || 'eco-explorer'}-certificate.png`
    link.click()
  }

  return (
    <div className="app-shell">
      {showConfetti && <div className="confetti" aria-hidden="true" />}
      <header className="app-header">
        <span className="brand">🌱 SustainZone</span>
        <button className="admin-link" onClick={() => setShowAdmin((v) => !v)} aria-label="Toggle admin panel">⚙️</button>
      </header>

      <main className="screen-panel fade-in">
        {screen === 'welcome' && <section>
          <h1>SustainZone Eco Explorer Challenge</h1>
          <p className="subtitle">Can you help protect water, reduce waste and look after the planet?</p>
          <div className="mission-cards">
            <article>♻️ <strong>Recycle</strong></article>
            <article>💧 <strong>Save Water</strong></article>
            <article>🌳 <strong>Protect Nature</strong></article>
          </div>
          <p className="counter">Eco Explorers completed today: {dayCounter}</p>
          <button className="primary" onClick={() => setScreen('details')}>Start My Eco Mission</button>
        </section>}

        {screen === 'details' && <section>
          <h2>Who is our Eco Explorer today?</h2>
          <label htmlFor="childName">First name</label>
          <input id="childName" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
          <label className="checkbox-row">
            <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} />
            <span>A parent or guardian agrees that this child can take part and use the webcam photo only to create the certificate. Nothing is saved or uploaded.</span>
          </label>
          <button className="primary" disabled={!name.trim() || !consentGiven} onClick={goToCameraScreen}>Continue to Photo</button>
        </section>}

        {screen === 'camera' && <section>
          <h2>Take your Eco Explorer photo</h2>
          {!photo && !cameraError && <video ref={videoRef} autoPlay playsInline className="camera" />}
          {photo && <img src={photo} className="camera" alt="Captured explorer" />}
          {cameraError && <p>Camera access is needed to add your photo to the certificate. You can still continue without a photo.</p>}
          <div className="button-row">
            {!photo && !cameraError && <button className="primary" onClick={takePhoto}>Take Photo</button>}
            {photo && <button className="secondary" onClick={goToCameraScreen}>Retake Photo</button>}
            <button className="primary" onClick={() => { stopCamera(); setScreen('quiz') }}>Continue to Quiz</button>
          </div>
        </section>}

        {screen === 'quiz' && <section>
          <h2>Eco Mission Quiz</h2>
          <p>Question {currentQuestionIndex + 1} of 5</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
          <p className="counter">Current score: {score} / 100</p>
          <article className={`question-card ${isCorrect === false ? 'soft-shake' : ''}`}>
            <p className="question">{activeQuestion.prompt}</p>
            <div className="answers-grid">
              {activeQuestion.answers.map((answer) => {
                const isAnswerCorrect = answer === activeQuestion.correctAnswer
                const isSelected = answer === selectedAnswer
                return <button key={answer} className={`answer-btn ${selectedAnswer && isAnswerCorrect ? 'correct' : ''} ${selectedAnswer && isSelected && !isAnswerCorrect ? 'wrong' : ''}`} onClick={() => handleAnswer(answer)} disabled={Boolean(selectedAnswer)}>{answer}</button>
              })}
            </div>
          </article>
          {selectedAnswer && <div className={`feedback-card ${isCorrect ? 'yes' : 'no'}`}>
            <p>{isCorrect ? 'Great job, that is right.' : `Good try. The correct answer is ${activeQuestion.correctAnswer}.`}</p>
            <p><strong>Did you know?</strong> {activeQuestion.explanation}</p>
            <button className="primary" onClick={handleNextQuestion}>Next Question</button>
          </div>}
        </section>}

        {screen === 'result' && <section>
          <h2>Mission Complete</h2>
          <p>Well done, {name}</p>
          <p>You scored {score} / 100</p>
          <p className="badge">{badge}</p>
          <p>{encouragementMessage}</p>
          <div className="button-row">
            <button className="primary" onClick={() => setScreen('certificate')}>Generate Certificate</button>
            <button className="secondary" onClick={() => { setCurrentQuestionIndex(0); setScore(0); setSelectedAnswer(null); setIsCorrect(null); setScreen('quiz') }}>Try Again</button>
          </div>
        </section>}

        {screen === 'certificate' && <section>
          <div ref={certificateRef} className="certificate">
            <h2>CERTIFICATE OF COMPLETION</h2>
            <p className="cert-main">SustainZone Eco Explorer Challenge</p>
            <p className="presented">Presented to: <strong>{name}</strong></p>
            <div className="cert-content">
              {photo ? <img src={photo} alt="Explorer portrait" className="cert-photo" /> : <div className="cert-photo placeholder">🌍 Eco Star</div>}
              <div>
                <p>Congratulations, you completed the SustainZone Eco Explorer Challenge at the Hertfordshire County Show.</p>
                <p className="cert-score">Score: {score} / 100</p>
                <p className="badge">{badge}</p>
              </div>
            </div>
            <p>Certificate number: {certificateNumber}</p>
            <p>Date of issue: {new Date().toLocaleDateString()}</p>
            <p>Authorised Representative<br />SustainZone</p>
            <footer>
              <p><strong>SustainZone</strong></p>
              <p>Helping businesses become carbon ready, tender ready and supply chain ready.</p>
              <p>Hertfordshire County Show 2026</p>
              <p className="privacy-note">Name and photo are used only on this device to generate this certificate and are cleared when the challenge is reset.</p>
            </footer>
          </div>
          <div className="button-row">
            <button className="primary" onClick={downloadCertificate}>Download Certificate</button>
            <button className="primary" onClick={resetChallenge}>Start New Challenge</button>
          </div>
        </section>}
      </main>

      {showAdmin && <aside className="admin-panel"><small>Admin: completed today (session only): {dayCounter}</small></aside>}
      <p className="privacy">Local only experience: no names, answers, or photos are uploaded or saved.</p>
    </div>
  )
}

export default App
