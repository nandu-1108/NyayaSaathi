
import React, { useState } from 'react'
import './index.css'
import { Scale, MessageCircle } from 'lucide-react'

const App = () => {
  const [Problem, setProblem] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [analysedProblems, setAnalysedProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const [guidelines, setGuidelines] = useState('')
  const [guidelinesError, setGuidelinesError] = useState('')


  // STEP 1: ANALYSE PROBLEM AND GENERATE BOTH RESPONSES

  async function handleAnalyse() {
    if (!Problem.trim()) {
      setMessage('Please describe your problem first.')
      return
    }

    setLoading(true)
    setMessage('Analysing your situation...')

    try {
      const response = await fetch('http://127.0.0.1:5000/analyse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Problem: Problem.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.')
      }

      // Receive both results from the same API request.

      const analysisResult = data.analysis
      const guidelinesResult = data.guidelines

      if (
        typeof analysisResult !== 'string' ||
        !analysisResult.trim() ||
        typeof guidelinesResult !== 'string' ||
        !guidelinesResult.trim()
      ) {
        throw new Error('The analysis or legal guidance was missing. Please try again.')
      }

      let savedProblem = {
        id: editingId !== null ? editingId : Date.now(),
        problem: Problem.trim(),
        analysis: analysisResult,
        guidelines: guidelinesResult
      }

      if (editingId !== null) {
        setAnalysedProblems(prev =>
          prev.map(item =>
            item.id === editingId ? savedProblem : item
          )
        )
      } else {
        setAnalysedProblems(prev => [...prev, savedProblem])
      }

      setSelectedProblem(savedProblem)
      setGuidelines('')
      setGuidelinesError('')
      setMessage(analysisResult)
      setEditingId(null)
      setStep(2)

    } catch (error) {
      console.error('Analysis error:', error)

      if (error instanceof TypeError) {
        setMessage('Error: Unable to connect to the backend. Please check whether Flask is running.')
      } else {
        setMessage(`Error: ${error.message}`)
      }

    } finally {
      setLoading(false)
    }
  }


  // STEP 3: we get the guidelines from the selected problem, if available,if not,we show the error message here

  function handleGetGuidelines(problem = selectedProblem) {
    if (!problem) {
      setGuidelinesError('Please select a problem first.')
      return
    }

    if (!problem.guidelines) {
      setGuidelinesError('Legal guidance is not available. Please analyse the problem again.')
      return
    }

    setSelectedProblem(problem)
    setGuidelines(problem.guidelines)
    setGuidelinesError('')
    setShowGuidelines(false)
    setStep(3)
  }


  // here we can saw the already analysed problem and its analysis, and guidelines

  function handleViewAnalysis(problem) {
    setSelectedProblem(problem)
    setProblem(problem.problem)
    setMessage(problem.analysis)
    setGuidelines(problem.guidelines || '')
    setGuidelinesError('')
    setStep(2)
  }


  // here providing option to edit the already analysing problem 

  function handleEdit(problem) {
    setSelectedProblem(problem)
    setProblem(problem.problem)
    setMessage('')
    setGuidelines('')
    setGuidelinesError('')
    setEditingId(problem.id)
    setStep(1)
  }


  // this funstion is to new pronlem button to analyse the new problem

  function handleNewProblem() {
    setProblem('')
    setMessage('')
    setSelectedProblem(null)
    setGuidelines('')
    setGuidelinesError('')
    setEditingId(null)
    setShowGuidelines(false)
    setStep(1)
  }


  // this function is to delete the stored problem from the list

  function handleDelete(id) {
    setAnalysedProblems(prev =>
      prev.filter(item => item.id !== id)
    )

    if (selectedProblem?.id === id) {
      setSelectedProblem(null)
      setMessage('')
      setGuidelines('')
      setGuidelinesError('')
    }

    if (editingId === id) {
      handleNewProblem()
    }
  }


  return (
    <>
      <div className="bg-emerald-950 p-4 pl-8 rounded-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex items-center gap-3">
            <Scale
              size={50}
              className="shrink-0 text-emerald-50 font-bold m-2 bg-emerald-600 p-1 rounded-md"
            />

            <div className="flex flex-col gap-1">
              <h1 className="text-emerald-50 font-bold text-3xl sm:text-4xl mt-2">
                NyayaSaathi
              </h1>

              <p className="text-slate-300">
                Legal awareness for everyone
              </p>
            </div>
          </div>

          
        </div>

        <hr className="text-amber-50 mt-2 mr-5" />

        <br />

        <span className="text-amber-50 bg-emerald-800 p-1 rounded-xl text-sm opacity-50 font-bold">
          LEGAL AWARENESS
        </span>

        <h3 className="text-blue-50 font-bold mt-6 mb-5 text-xl sm:text-2xl">
          Understand the Law. Know Your Rights
        </h3>

        <p className="text-gray-400">
          Facing a problem and unsure what the law says? Whether you're dealing
          with online threats, workplace issues, family disputes, cybercrime,
          or other everyday challenges, NyayaSaathi helps you understand your
          rights and the legal options available to you.
          Simply describe your situation in your own words. Get clear,
          easy-to-understand legal information, explore the laws that may apply
          to your situation, and discover possible next steps — all in one
          place, in English or Kannada.
          <br />
          "Understand your situation. Know your rights. Make informed decisions."
        </p>
      </div>


    

      <div>
        <ol className="list-decimal mt-3 ml-7 flex flex-row justify-around">
          <li className={`${step === 1 ? 'text-emerald-500 underline' : 'text-black font-bold'}`}>
            Describe Problem
          </li>

          <span className="text-black text-xl">➜</span>

          <li className={`${step === 2 ? 'text-emerald-500 underline' : 'text-black font-bold'}`}>
            Analyse Situation
          </li>

          <span className="text-black text-xl">➜</span>

          <li className={`${step === 3 ? 'text-emerald-500 underline' : 'text-black font-bold'}`}>
            Get Guidance
          </li>
        </ol>
      </div>


      {/* STEP 1: DESCRIBE PROBLEM */}

      {step === 1 && (
        <div className="mt-5 px-4">

          <div className="flex items-center justify-between gap-3">
            <p className="font-bold font-sans flex items-center gap-2">
              <MessageCircle size={24} className="shrink-0 text-emerald-950" />
              Tell us what happened
            </p>

            <button
              onClick={handleNewProblem}
              className="text-black rounded-2xl p-2 font-bold border-2 shrink-0 mr-4 hover:bg-emerald-600"
            >
              + New Problem
            </button>
          </div>

          <textarea
            placeholder="Describe your problem in your own words..."
            id="text"
            name="problem"
            className="mt-4 w-full p-3 h-40 rounded-2xl bg-blue-50"
            value={Problem}
            onChange={(e) => setProblem(e.target.value)}
          />

          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="bg-emerald-800 mt-4 font-bold text-cyan-50 p-3 w-full sm:w-auto sm:min-w-80 rounded-2xl hover:bg-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Analysing...' : 'Analyse My Situation'}
          </button>

          {message && (
            <p className="text-red-700 mt-3">
              {message.startsWith('Error:') ||
                message.startsWith('Unable to') ||
                message.startsWith('Please')
                ? message
                : ''}
            </p>
          )}


          {/* SAVED PROBLEMS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10 mb-3">

            {analysedProblems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl shadow-md shadow-emerald-950"
              >
                <h2 className="font-bold text-xl">
                  My Legal Concern
                </h2>

                <p className="mt-2 whitespace-pre-wrap wrap-break-word">
                  {item.problem}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">

                  <button
                    onClick={() => handleViewAnalysis(item)}
                    className="text-amber-50 font-bold text-sm bg-gray-600 w-30 p-1 rounded-2xl opacity-70 hover:bg-gray-900"
                  >
                    View Analysis
                  </button>

                  <button
                    onClick={() => handleGetGuidelines(item)}
                    className="text-amber-50 font-bold text-sm bg-gray-600 w-30 p-1 rounded-2xl opacity-70 hover:bg-gray-900"
                  >
                    Get Guidelines
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-white font-bold text-sm bg-red-700 p-1 rounded-2xl hover:bg-red-800"
                  >
                    Delete Problem
                  </button>

                </div>
              </div>
            ))}

          </div>
        </div>
      )}


      {/* STEP 2: ANALYSIS */}

      {step === 2 && selectedProblem && (
        <div className="flex flex-col gap-4 mt-7 px-4 sm:px-8 bg-white shadow-md shadow-emerald-950 rounded-2xl">

          <h1 className="text-2xl font-bold text-emerald-950">
            Analyse Your Situation
          </h1>

          <p className="text-gray-700 bg-emerald-500 p-2 rounded-md wrap-break-word whitespace-pre-wrap">
            {selectedProblem.problem}
          </p>

          <div className="bg-emerald-50 p-4 rounded-xl whitespace-pre-wrap wrap-break-word text-gray-800 leading-7">
            {selectedProblem.analysis}
          </div>

          <button
            onClick={() => handleEdit(selectedProblem)}
            className="text-blue-50 font-bold bg-emerald-800 w-50 p-2 rounded-2xl mt-4 hover:bg-emerald-600"
          >
            Back to Edit
          </button>

          <button
            onClick={() => handleGetGuidelines(selectedProblem)}
            className="text-black border-2 w-50 border-b-emerald-900 p-2 mb-4 rounded-2xl font-bold hover:bg-emerald-500"
          >
            Continue to Guidance
          </button>

        </div>
      )}


      {/* STEP 3: PERSONALIZED LEGAL GUIDANCE */}

      {step === 3 && selectedProblem && (
        <div className="bg-white shadow-md shadow-emerald-950 rounded-2xl p-6 mx-4 mt-6">

          <h1 className="text-2xl font-extrabold text-blue-950">
            Get Legal Guidance
          </h1>

          <p className="mt-4 ml-7 mr-7 font-semibold">
            Understand the legal information that may relate to your situation,
            learn about your rights, and explore possible next steps.
            NyayaSaathi provides clear, easy-to-understand legal awareness in
            English and Kannada to help you make informed decisions. The
            guidance is for educational purposes and does not replace advice
            from a qualified lawyer.
          </p>

          {guidelinesError && (
            <div className="mt-5 bg-red-50 text-red-700 p-3 rounded-xl">
              {guidelinesError}
            </div>
          )}

          {guidelines && (
            <div className="mt-6 bg-emerald-50 p-4 rounded-xl whitespace-pre-wrap wrap-break-word text-gray-800 leading-7">
              {guidelines}
            </div>
          )}

          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="mt-5 font-semibold text-emerald-800 underline hover:text-emerald-600"
          >
            Important Guidelines ↓
          </button>

          {showGuidelines === true && (
            <div className="text-amber-950">
              <ul className="list-disc ml-3">

                <li className="mt-2 bg-emerald-50 p-2 rounded-xl">
                  <b>Protect your privacy:</b> Don't share passwords, bank details,
                  or unnecessary personal information.
                </li>

                <li className="mt-2 bg-emerald-50 p-2 rounded-xl">
                  <b>Legal awareness only:</b> The information is educational and
                  doesn't replace advice from a qualified lawyer.
                </li>

                <li className="mt-2 bg-emerald-50 p-2 rounded-xl">
                  <b>Urgent situations:</b> If someone is in immediate danger,
                  contact local emergency services.
                </li>

              </ul>
            </div>
          )}

          <br />

          <button
            onClick={() => {
              setStep(1)
              setProblem('')
              setMessage('')
              setSelectedProblem(null)
              setGuidelines('')
              setGuidelinesError('')
              setEditingId(null)
              setShowGuidelines(false)
            }}
            className="text-blue-50 font-bold bg-emerald-800 w-50 p-2 rounded-2xl mt-4 hover:bg-emerald-600"
          >
            ← Back To Dashboard
          </button>

        </div>
      )}

    </>
  )
}

export default App
