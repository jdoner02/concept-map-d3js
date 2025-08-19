import ConceptMapVisualization from './components/ConceptMapVisualization'
import './components/ConceptMap.css'

function App() {
  return (
    <div className="App">
      {/**
       * A simple heading gives the page a recognisable anchor.  Both
       * human visitors and automated tests use it to confirm the
       * interface has loaded.  The inline style keeps dependencies light
       * while centring the text on screen.
       */}
      <h1 style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0.5rem 0' }}>
        Interactive Concept Map
      </h1>
      <ConceptMapVisualization />
    </div>
  )
}

export default App
