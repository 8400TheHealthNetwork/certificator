import israel from '/Emblem_of_Israel.svg'
import fhir from '/icon-fhir-720.png'
import logo from '/logo.svg'
import flameInline from '/icon-fhir-48.png';
import Report from './components/Report'
import './App.css'

import data from './data.json'

function App() {
  return (
    <>
      <div className="header">
        <img src={logo} className="logo" alt="Ministry of Health logo" />
        <div className="header-title">
          <div className="title title-text">Ministry of Health</div>
          <div className="title subtitle-text">FHIR<sup className="subtitle-r">®</sup> Certificator - Report</div>
        </div>
        <img src={fhir} className="logo" alt="FHIR logo" />
        <img src={israel} className="israel-logo" alt="Israel flag" />
      </div>
      <div className="card">
        <Report data={data}></Report>
      </div>
      <p className="copyrigh-footer">
      © Copyright Ministry of Health Israel 2024. All Rights Reserved
      <br />HL7®, FHIR® and the FHIR <img src={flameInline} className="flameInline" alt="[FLAME SYMBOL]"></img>® flame design are the registered trademarks of Health Level Seven International and their use does not constitute endorsement by HL7.
      </p>
    </>
  )
}

export default App
