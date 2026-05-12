import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'

type Screen = 'welcome' | 'details' | 'camera' | 'quiz' | 'result' | 'certificate'

type Question = {
  prompt: string
  answers: string[]
  correctAnswer: string
}

const quizQuestions: Question[] = [
  {
    prompt: 'What should we do with plastic bottles after using them?',
    answers: ['Throw them anywhere', 'Recycle them', 'Burn them', 'Leave them outside'],
    correctAnswer: 'Recycle them',
  },
  {
    prompt: 'Why is saving water important?',
    answers: ['Because clean water is limited', 'Because water has no use', 'Because taps like running all day', 'Because rain never stops'],
    correctAnswer: 'Because clean water is limited',
  },
  {
    prompt: 'What does recycling help reduce?',
    answers: ['Waste', 'Trees', 'Clean air', 'Sunlight'],
    correctAnswer: 'Waste',
  },
  {
    prompt: 'Which one is better for the planet?',
    answers: ['Using a reusable bottle', 'Using a new plastic bottle every time', 'Throwing bottles away', 'Leaving rubbish on the ground'],
    correctAnswer: 'Using a reusable bottle',
  },
  {
    prompt: 'What can businesses do to help the planet?',
    answers: ['Measure and reduce their carbon emissions', 'Ignore waste', 'Use more packaging', 'Waste more energy'],
    correctAnswer: 'Measure and reduce their carbon emissions',
  },
]

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [name, setName] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null)
  const [dayCounter, setDayCounter] = useState(0)
  const [showAdmin, setShowAdmin] = useState(false)
  const [finishedCounted, setFinishedCounted] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const certificateRef = useRef<HTMLDivElement>(null)

  const activeQuestion = quizQuestions[currentQuestionIndex]

  const encouragementMessage = useMemo(() => {
    if (score === 5) return 'Amazing work! You are an eco hero.'
    if (score >= 3) return 'Great effort! Every eco action makes a big difference.'
    return 'Brilliant try! Keep learning and helping our planet every day.'
  }, [score])

  const startCamera = async () => {
    try {
      setCameraError(false)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
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

  const retakePhoto = async () => {
    setPhoto(null)
    await startCamera()
  }

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === activeQuestion.correctAnswer
    if (isCorrect) {
      setScore((prev) => prev + 1)
      setAnswerFeedback('Correct, great job.')
    } else {
      setAnswerFeedback(`Good try, here is the right answer: ${activeQuestion.correctAnswer}.`)
    }

    setTimeout(() => {
      setAnswerFeedback(null)
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
      } else {
        setScreen('result')
        if (!finishedCounted) {
          setDayCounter((prev) => prev + 1)
          setFinishedCounted(true)
        }
      }
    }, 1300)
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
    setAnswerFeedback(null)
    setFinishedCounted(false)
  }

  const downloadCertificate = async () => {
    if (!certificateRef.current) return
    const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true })
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `${name || 'eco-explorer'}-certificate.png`
    link.click()
  }

  const printCertificate = async () => {
    if (!certificateRef.current) return
    const canvas = await html2canvas(certificateRef.current, { scale: 2, useCORS: true })
    const image = canvas.toDataURL('image/png')
    const newWindow = window.open('', '_blank')
    if (!newWindow) return
    newWindow.document.write(`<img src="${image}" style="width:100%;" alt="certificate"/>`)
    newWindow.document.close()
    newWindow.focus()
    newWindow.print()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">🌱 SustainZone</span>
        <button className="admin-link" onClick={() => setShowAdmin((v) => !v)} aria-label="Toggle admin panel">⚙️</button>
      </header>

      <main className="screen-panel fade-in">
        {screen === 'welcome' && (
          <section>
            <h1>SustainZone Eco Explorer Challenge</h1>
            <p>Learn how to protect water, reduce waste and help the planet.</p>
            <p className="counter">Eco Explorers completed today: {dayCounter}</p>
            <button className="primary" onClick={() => setScreen('details')}>Start Challenge</button>
          </section>
        )}

        {screen === 'details' && (
          <section>
            <h2>Enter your details</h2>
            <label htmlFor="childName">Child first name only</label>
            <input id="childName" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
            <label className="checkbox-row">
              <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} aria-label="Parent or guardian consent" />
              <span>I confirm that a parent or guardian gives permission for this child to take part and use the webcam photo only for generating this certificate. No photo or personal data will be stored.</span>
            </label>
            <button className="primary" disabled={!name.trim() || !consentGiven} onClick={goToCameraScreen}>Continue</button>
          </section>
        )}

        {screen === 'camera' && (
          <section>
            <h2>Take your explorer photo</h2>
            {!photo && !cameraError && <video ref={videoRef} autoPlay playsInline className="camera" aria-label="Webcam preview" />}
            {photo && <img src={photo} className="camera" alt="Captured explorer" />}
            {cameraError && <p>Camera access is needed to add your photo to the certificate. You can still continue without a photo.</p>}
            <div className="button-row">
              {!photo && !cameraError && <button className="primary" onClick={takePhoto}>Take Photo</button>}
              {photo && <button className="secondary" onClick={retakePhoto}>Retake Photo</button>}
              <button className="primary" onClick={() => { stopCamera(); setScreen('quiz') }}>Continue to Quiz</button>
            </div>
          </section>
        )}

        {screen === 'quiz' && (
          <section>
            <h2>Question {currentQuestionIndex + 1} of 5</h2>
            <p className="question">{activeQuestion.prompt}</p>
            <div className="answers-grid">
              {activeQuestion.answers.map((answer) => (
                <button key={answer} className="secondary" onClick={() => handleAnswer(answer)} disabled={Boolean(answerFeedback)}>{answer}</button>
              ))}
            </div>
            {answerFeedback && <p className="feedback">{answerFeedback}</p>}
          </section>
        )}

        {screen === 'result' && (
          <section>
            <h2>Well done, {name}</h2>
            <p>You scored {score} out of 5</p>
            <p>You are now a SustainZone Eco Explorer.</p>
            <p>{encouragementMessage}</p>
            <div className="button-row">
              <button className="primary" onClick={() => setScreen('certificate')}>Generate Certificate</button>
              <button className="secondary" onClick={() => { setCurrentQuestionIndex(0); setScore(0); setAnswerFeedback(null); setScreen('quiz'); }}>Try Again</button>
            </div>
          </section>
        )}

        {screen === 'certificate' && (
          <section>
            <div ref={certificateRef} className="certificate">
              <h2>SustainZone Eco Explorer Certificate</h2>
              <p className="presented">Presented to <strong>{name}</strong></p>
              <div className="cert-content">
                {photo ? <img src={photo} alt="Explorer portrait" className="cert-photo" /> : <div className="cert-photo placeholder">📸 Add photo next time</div>}
                <div>
                  <p className="cert-score">Score: {score} out of 5</p>
                  <p>Congratulations, you completed the SustainZone Eco Explorer Challenge at the Hertfordshire County Show.</p>
                  <p className="icons">💧 ♻️ 🌳 🌍 ⚡</p>
                </div>
              </div>
              <footer>
                <p><strong>SustainZone</strong></p>
                <p>Helping businesses become carbon ready, tender ready and supply chain ready.</p>
                <p>Hertfordshire County Show 2026</p>
              </footer>
            </div>
            <div className="button-row">
              <button className="primary" onClick={downloadCertificate}>Download Certificate</button>
              <button className="secondary" onClick={printCertificate}>Print Certificate</button>
              <button className="primary" onClick={resetChallenge}>Start New Challenge</button>
            </div>
          </section>
        )}
      </main>

      {showAdmin && (
        <aside className="admin-panel">
          <button className="secondary" onClick={() => {
            if (window.confirm('Reset the day counter?')) setDayCounter(0)
          }}>Reset Day Counter</button>
        </aside>
      )}

      <p className="privacy">Your name and photo are only used on this device to create the certificate and are cleared when the challenge is reset.</p>
    </div>
  )
}

export default App
