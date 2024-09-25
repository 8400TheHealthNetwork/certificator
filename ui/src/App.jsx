import israel from '/Emblem_of_Israel.svg'
import fhir from '/icon-fhir-720.png'
import logo from '/logo.svg'
import flameInline from '/icon-fhir-48.png';
import Certificator from './components/Certificator'
import './App.css'

function App() {
  return (
    <>
      <div className="header">
        <img src={logo} className="logo" alt="Ministry of Health logo" />
        <div className="header-title">
          <div className="title title-text">Ministry of Health</div>
          <div className="title subtitle-text">FHIR<sup className="subtitle-r">®</sup> Certificator</div>
        </div>
        <img src={fhir} className="logo" alt="FHIR logo" />
        <img src={israel} className="israel-logo" alt="Israel flag" />
      </div>
      <div className="card">
        <Certificator></Certificator>
      </div>
      <p className="copyright-footer">
      © Copyright Ministry of Health Israel 2024. All Rights Reserved
      <br />HL7®, FHIR® and the FHIR <img src={flameInline} className="flameInline" alt="[FLAME SYMBOL]"></img>® flame design are the registered trademarks of Health Level Seven International and their use does not constitute endorsement by HL7.
      </p>
    </>
  )
}

export default App
