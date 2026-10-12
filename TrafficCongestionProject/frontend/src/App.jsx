import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:5000";
const initialForm = {
  location_id: 1, traffic_volume: 850, avg_vehicle_speed: 25,
  vehicle_count_cars: 700, vehicle_count_trucks: 50, vehicle_count_bikes: 30,
  weather_condition: "Rainy", temperature: 27, humidity: 80,
  accident_reported: 1, signal_status: "Red", hour: 8, day_of_week: 0, is_weekend: 0
};
const navItems = [["Dashboard","▦"],["Predict Congestion","↗"],["Dataset Analysis","▤"],["Prediction History","◷"],["Model Performance","▥"],["About Project","ⓘ"]];
const FEATURES = ["location_id","traffic_volume","avg_vehicle_speed","vehicle_count_cars","vehicle_count_trucks","vehicle_count_bikes","weather_condition","temperature","humidity","accident_reported","signal_status","hour","day_of_week","is_weekend"];

function Badge({level}) { return <span className={`badge ${String(level||"").toLowerCase()}`}>{level || "Unknown"}</span>; }
function Stat({title,value,note,tone="blue"}) { return <div className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}>◈</span></div><h3>{value}</h3><p className="stat-note">{note}</p>{String(value).includes("%") && <div className="mini-bar"><span style={{width:`${parseFloat(value)}%`}} /></div>}</div>; }
function Empty({title,text,action,onAction}) { return <div className="empty-state"><div className="empty-icon">↗</div><strong>{title}</strong><p>{text}</p>{action && <button className="outline-button" onClick={onAction}>{action}</button>}</div>; }
function Info({title,text}) { return <div className="info-card"><span className="info-symbol">ⓘ</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function Field({name,label,value,onChange,type="number",min,max,options}) { return <label className="field"><span>{label}</span>{options ? <select name={name} value={value} onChange={onChange}>{options.map(o=>{const v=Array.isArray(o)?o[0]:o;const t=Array.isArray(o)?o[1]:o;return <option key={v} value={v}>{t}</option>})}</select> : <input name={name} type={type} value={value} onChange={onChange} min={min} max={max} required />}</label>; }
function ModelBar({label,value,green}) { return <div className="model-row"><div className="model-label"><span>{label}</span><strong>{value.toFixed(2)}%</strong></div><div className="progress"><span className={green?"green-fill":""} style={{width:`${value}%`}} /></div></div>; }

export default function App() {
    const [theme, setTheme] = useState(
    () => localStorage.getItem("trafficiq-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("trafficiq-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => current === "dark" ? "light" : "dark");
  };
    const [page,setPage] = useState("Dashboard");
  const [form,setForm] = useState(initialForm);
  const [prediction,setPrediction] = useState(null);
  const [predictionError,setPredictionError] = useState("");
  const [predicting,setPredicting] = useState(false);
  const [history,setHistory] = useState([]);
  const [datasetFile,setDatasetFile] = useState(null);
  const [datasetResult,setDatasetResult] = useState(null);
  const [datasetError,setDatasetError] = useState("");
  const [analyzing,setAnalyzing] = useState(false);
  const [downloading,setDownloading] = useState(false);
  const totalPredicted = useMemo(()=>Object.values(datasetResult?.prediction_counts||{}).reduce((a,b)=>a+b,0),[datasetResult]);

  const updateForm = e => { const {name,value,type}=e.target; setForm(p=>({...p,[name]:type==="number"?Number(value):value})); };
  async function predict(e) {
    e.preventDefault(); setPredicting(true); setPredictionError(""); setPrediction(null);
    try {
      const res=await fetch(`${API}/api/predict`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||"Prediction failed.");
      const item={...data,location_id:form.location_id,traffic_volume:form.traffic_volume,avg_vehicle_speed:form.avg_vehicle_speed,time:new Date().toLocaleTimeString()};
      setPrediction(item); setHistory(p=>[item,...p]);
    } catch(err) { setPredictionError(`${err.message} Check that Flask is running on port 5000.`); }
    finally { setPredicting(false); }
  }
  async function analyze() {
    if(!datasetFile){setDatasetError("Choose a CSV file first.");return;}
    setAnalyzing(true);setDatasetError("");setDatasetResult(null);
    try {
      const body=new FormData();body.append("file",datasetFile);
      const res=await fetch(`${API}/api/analyze-dataset`,{method:"POST",body});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Analysis failed.");
      setDatasetResult(data);
    } catch(err) {setDatasetError(err.message||"Could not connect to Flask.");}
    finally {setAnalyzing(false);}
  }
  async function download() {
    if(!datasetFile)return;setDownloading(true);setDatasetError("");
    try {
      const body=new FormData();body.append("file",datasetFile);
      const res=await fetch(`${API}/api/download-analyzed-dataset`,{method:"POST",body});
      if(!res.ok){const d=await res.json();throw new Error(d.error||"Download failed.");}
      const blob=await res.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");
      a.href=url;a.download="traffic_congestion_predictions.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    } catch(err){setDatasetError(err.message||"Download failed.");}
    finally{setDownloading(false);}
  }

  const dashboard = <section className="page-content">
    <div className="welcome-row"><div><div className="eyebrow">TRAFFIC INTELLIGENCE PLATFORM</div><h1>Traffic Overview<span>.</span></h1><p className="subtitle">Understand traffic patterns and predict congestion using machine learning.</p></div><button className="primary-button" onClick={()=>setPage("Predict Congestion")}>＋ New Prediction</button></div>
    <div className="hero-banner"><div className="hero-copy"><div className="hero-tag">✦ MACHINE LEARNING INSIGHTS</div><h2>Smarter roads start<br/>with better predictions.</h2><p>Analyze traffic conditions, explore patterns, and predict congestion levels with your trained ML model.</p><button className="hero-button" onClick={()=>setPage("Predict Congestion")}>Predict Congestion →</button></div><div className="road-art"><div className="road-circle circle-one"/><div className="road-circle circle-two"/><div className="road"><div className="road-line"/><span className="road-car car-one">🚙</span><span className="road-car car-two">🚗</span><span className="road-car car-three">🚕</span></div><div className="floating-chip chip-one">↗ Traffic flow</div><div className="floating-chip chip-two">AI Prediction</div></div></div>
    <div className="section-heading"><div><h2>Performance Snapshot</h2><p>Model evaluation results and this session.</p></div><span className="live-label">● MODEL SUMMARY</span></div>
    <div className="stats-grid"><Stat title="GRADIENT BOOSTING ACCURACY" value="96.25%" note="Tuned test set" tone="green"/><Stat title="RANDOM FOREST ACCURACY" value="88.75%" note="Tuned test set" tone="purple"/><Stat title="SESSION PREDICTIONS" value={String(history.length).padStart(2,"0")} note="Individual predictions" tone="blue"/><Stat title="CONGESTION CLASSES" value="03" note="Low · Medium · High" tone="orange"/></div>
    <div className="bottom-grid"><div className="panel"><div className="panel-heading"><div><h3>Recent Predictions</h3><p>Results from this browser session</p></div><button className="text-button" onClick={()=>setPage("Prediction History")}>View all →</button></div>{history.length===0?<Empty title="No predictions yet" text="Run your first prediction to see results here." action="Make a prediction" onAction={()=>setPage("Predict Congestion")}/>:<div className="table-wrap"><table><thead><tr><th>TIME</th><th>LOCATION</th><th>VOLUME</th><th>RESULT</th></tr></thead><tbody>{history.slice(0,5).map((x,i)=><tr key={i}><td>{x.time}</td><td>{x.location_id}</td><td>{x.traffic_volume}</td><td><Badge level={x.predicted_congestion_level}/></td></tr>)}</tbody></table></div>}</div><div className="panel"><div className="panel-heading"><div><h3>Model Comparison</h3><p>Test accuracy</p></div></div><ModelBar label="Random Forest" value={88.75}/><ModelBar label="Gradient Boosting" value={96.25} green/><Info title="Best performing model" text="Gradient Boosting was selected as the final model for this dataset."/></div></div>
  </section>;

  const predictionPage = <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">MACHINE LEARNING ENGINE</div><h1>Predict Congestion<span>.</span></h1><p className="subtitle">Enter traffic conditions and query your trained model.</p></div><span className="model-pill">● GRADIENT BOOSTING</span></div>
    <div className="prediction-layout"><form className="panel prediction-form" onSubmit={predict}><div className="panel-heading"><div><h3>Traffic Parameters</h3><p>Enter the 14 features expected by the model.</p></div></div>
      <div className="form-section-title">TRAFFIC & VEHICLE DATA</div><div className="form-grid">{[["location_id","Location ID"],["traffic_volume","Traffic Volume"],["avg_vehicle_speed","Average Speed (km/h)"],["vehicle_count_cars","Cars"],["vehicle_count_trucks","Trucks"],["vehicle_count_bikes","Bikes"]].map(([n,l])=><Field key={n} name={n} label={l} value={form[n]} onChange={updateForm} min={0}/>)}</div>
      <div className="form-section-title">ENVIRONMENTAL DATA</div><div className="form-grid"><Field name="temperature" label="Temperature (°C)" value={form.temperature} onChange={updateForm}/><Field name="humidity" label="Humidity (%)" value={form.humidity} onChange={updateForm} min={0} max={100}/><Field name="weather_condition" label="Weather Condition" value={form.weather_condition} onChange={updateForm} options={["Clear","Cloudy","Rainy","Foggy","Stormy"]}/><Field name="signal_status" label="Signal Status" value={form.signal_status} onChange={updateForm} options={["Red","Yellow","Green"]}/></div>
      <div className="form-section-title">TIME & INCIDENT DETAILS</div><div className="form-grid"><Field name="accident_reported" label="Accident Reported" value={form.accident_reported} onChange={updateForm} options={[["0","No"],["1","Yes"]]}/><Field name="hour" label="Hour (0–23)" value={form.hour} onChange={updateForm} min={0} max={23}/><Field name="day_of_week" label="Day of Week (0–6)" value={form.day_of_week} onChange={updateForm} min={0} max={6}/><Field name="is_weekend" label="Weekend?" value={form.is_weekend} onChange={updateForm} options={[["0","No"],["1","Yes"]]}/></div>
      {predictionError&&<div className="error-message">{predictionError}</div>}<button className="primary-button predict-button" disabled={predicting}>{predicting?"Analyzing…":"✦ Predict Congestion Level"}</button><p className="form-footnote">Predictions are generated by your local Flask API.</p>
    </form><div className="result-column"><div className="panel result-panel"><div className="panel-heading"><div><h3>Prediction Result</h3><p>Model output</p></div></div>{prediction?<div className="result-content"><div className={`result-symbol ${String(prediction.predicted_congestion_level).toLowerCase()}`}>●</div><span className="result-caption">PREDICTED CONGESTION LEVEL</span><h2 className={String(prediction.predicted_congestion_level).toLowerCase()}>{prediction.predicted_congestion_level}</h2><Badge level={prediction.predicted_congestion_level}/><p className="result-description">Returned by your trained model for these input parameters.</p><div className="result-detail"><span>Traffic volume</span><strong>{prediction.traffic_volume}</strong></div><div className="result-detail"><span>Average speed</span><strong>{prediction.avg_vehicle_speed} km/h</strong></div><div className="result-detail"><span>Location</span><strong>{prediction.location_id}</strong></div></div>:<Empty title="Awaiting traffic data" text="Fill in the parameters and run a prediction to see the result."/>}</div><Info title="About this prediction" text="The model classifies congestion as Low, Medium, or High. It does not measure live road conditions or control signals."/></div></div>
  </section>;

  const datasetPage = <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">BATCH PREDICTION ENGINE</div><h1>Dataset Analysis<span>.</span></h1><p className="subtitle">Upload traffic records, inspect data quality, predict each row, and export results.</p></div></div>
    <div className="panel upload-panel"><div className="panel-heading"><div><h3>Upload Traffic Dataset</h3><p>CSV only · Up to 50,000 rows · 20 MB maximum</p></div><span className="panel-icon">⇧</span></div><label className="upload-dropzone"><input type="file" accept=".csv,text/csv" onChange={e=>{setDatasetFile(e.target.files?.[0]||null);setDatasetResult(null);setDatasetError("");}}/><span className="upload-icon">↑</span><strong>{datasetFile?datasetFile.name:"Choose a CSV file to upload"}</strong><span>{datasetFile?`${(datasetFile.size/1024).toFixed(1)} KB`:"Select your traffic dataset from your computer"}</span></label><div className="upload-actions"><button className="primary-button" onClick={analyze} disabled={analyzing||!datasetFile}>{analyzing?"Analyzing dataset…":"Analyze & Predict"}</button><span className="upload-hint">Uses your actual trained ML model</span></div>{datasetError&&<div className="error-message" role="alert">{datasetError}</div>}<div className="requirements-note"><strong>Required model columns</strong><p>{FEATURES.join(" · ")}</p><span>Existing congestion_level or congestion_score columns are never used as model inputs.</span></div></div>
    {datasetResult&&<><div className="section-heading dataset-section-heading"><div><h2>Analysis Summary</h2><p>{datasetResult.filename} · {datasetResult.total_rows.toLocaleString()} records analyzed</p></div><span className="live-label">● ANALYSIS COMPLETE</span></div>
      <div className="stats-grid"><Stat title="TOTAL RECORDS" value={datasetResult.total_rows.toLocaleString()} note="Rows processed"/><Stat title="ORIGINAL COLUMNS" value={datasetResult.total_columns} note="Before predicted label"/><Stat title="MISSING VALUES" value={datasetResult.missing_values} note="Across original columns" tone="orange"/><Stat title="DUPLICATE ROWS" value={datasetResult.duplicate_rows} note="Exact duplicate rows" tone="green"/></div>
      <div className="bottom-grid dataset-results-grid"><div className="panel"><div className="panel-heading"><div><h3>Predicted Congestion Distribution</h3><p>{totalPredicted.toLocaleString()} predictions</p></div></div>{["Low","Medium","High"].map(level=>{const count=datasetResult.prediction_counts[level]||0,pct=datasetResult.total_rows?count/datasetResult.total_rows*100:0;return <div className="model-row" key={level}><div className="model-label"><span>{level} Congestion</span><strong>{count} ({pct.toFixed(1)}%)</strong></div><div className="progress"><span className={`distribution-${level.toLowerCase()}`} style={{width:`${pct}%`}}/></div></div>})}<Info title="Interpretation" text="These are predicted classes, not ground-truth labels, accuracy measurements, or live traffic readings."/></div>
      <div className="panel"><div className="panel-heading"><div><h3>Export Results</h3><p>Original rows plus predicted labels</p></div></div><div className="download-card"><div className="download-icon">↓</div><strong>Analyzed dataset CSV</strong><p>Download all rows with a predicted_congestion_level column.</p><button className="primary-button" onClick={download} disabled={downloading}>{downloading?"Preparing CSV…":"Download Results CSV"}</button></div></div></div>
      <div className="panel dataset-preview-panel"><div className="panel-heading"><div><h3>Dataset Preview</h3><p>First 10 records with predicted labels</p></div><span className="badge low">MODEL OUTPUT</span></div><div className="table-wrap"><table><thead><tr>{datasetResult.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{datasetResult.preview.map((row,i)=><tr key={i}>{datasetResult.columns.map(c=><td key={c}>{c==="predicted_congestion_level"?<Badge level={row[c]}/>:String(row[c]??"—")}</td>)}</tr>)}</tbody></table></div></div></>}
  </section>;

  const historyPage = <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">SESSION ACTIVITY</div><h1>Prediction History<span>.</span></h1><p className="subtitle">Successful individual predictions in this browser session.</p></div><button className="outline-button" onClick={()=>setHistory([])}>Clear history</button></div><div className="panel history-panel">{history.length===0?<Empty title="No history yet" text="Successful predictions will appear here." action="Make a prediction" onAction={()=>setPage("Predict Congestion")}/>:<div className="table-wrap"><table><thead><tr><th>TIME</th><th>LOCATION</th><th>TRAFFIC VOLUME</th><th>AVG SPEED</th><th>PREDICTED LEVEL</th></tr></thead><tbody>{history.map((x,i)=><tr key={i}><td>{x.time}</td><td>{x.location_id}</td><td>{x.traffic_volume}</td><td>{x.avg_vehicle_speed} km/h</td><td><Badge level={x.predicted_congestion_level}/></td></tr>)}</tbody></table></div>}</div></section>;

  const performancePage = <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">EVALUATION RESULTS</div><h1>Model Performance<span>.</span></h1><p className="subtitle">Tuned test accuracy from the project notebook.</p></div></div><div className="stats-grid performance-stats"><Stat title="RANDOM FOREST" value="88.75%" note="Tuned test accuracy" tone="purple"/><Stat title="GRADIENT BOOSTING" value="96.25%" note="Selected final model" tone="green"/></div><div className="panel comparison-panel"><div className="panel-heading"><div><h3>Test Accuracy Comparison</h3><p>Reported notebook results</p></div></div><ModelBar label="Random Forest" value={88.75}/><ModelBar label="Gradient Boosting" value={96.25} green/><Info title="Interpretation" text="Accuracy is the fraction of test examples classified correctly. It does not guarantee performance on new real-world traffic."/></div></section>;

  const aboutPage = <section className="page-content"><div className="welcome-row"><div><div className="eyebrow">PROJECT INFORMATION</div><h1>About the Project<span>.</span></h1><p className="subtitle">Machine learning for traffic congestion classification.</p></div></div><div className="panel about-panel"><h2>Traffic Congestion Level Prediction</h2><p>This project uses supervised Machine Learning to classify congestion as Low, Medium, or High using traffic, vehicle, weather, accident, signal, location, and time-related features.</p><div className="about-facts"><div><span>Dataset</span><strong>2,000 records</strong></div><div><span>Original attributes</span><strong>17</strong></div><div><span>Target classes</span><strong>3</strong></div><div><span>Final algorithm</span><strong>Gradient Boosting</strong></div></div><h3>Algorithms</h3><p><strong>Random Forest:</strong> combines predictions from multiple decision trees.</p><p><strong>Gradient Boosting:</strong> builds trees sequentially to improve previous errors.</p><h3>Responsible use</h3><p>This is a decision-support prototype. It uses entered or uploaded data and does not connect to live traffic sensors or control road infrastructure.</p></div></section>;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon">↗</div><div><h2>Traffic<span>IQ</span></h2><p>INTELLIGENT MOBILITY</p></div></div><div className="nav-label">WORKSPACE</div><nav>{navItems.map(([name,icon])=><button key={name} className={`nav-item ${page===name?"active":""}`} onClick={()=>setPage(name)}><span className="nav-icon">{icon}</span><span className="nav-text">{name}</span></button>)}</nav><div className="sidebar-bottom"><span className="status-dot"/><div><strong>ML Engine</strong><p>Gradient Boosting</p></div><span className="online">LOCAL</span></div><div className="profile"><div className="avatar">G</div><div><strong>Project Workspace</strong><p>Traffic Analytics</p></div></div></aside>
    <main className="main-content"><header className="topbar">
      <div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div>
      <div className="top-actions">
        <span className="system-status"><span className="status-dot"/> LOCAL ML API</span>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className="theme-toggle-label">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <div className="top-avatar">G</div>
      </div>
    </header>{page==="Dashboard"&&dashboard}{page==="Predict Congestion"&&predictionPage}{page==="Dataset Analysis"&&datasetPage}{page==="Prediction History"&&historyPage}{page==="Model Performance"&&performancePage}{page==="About Project"&&aboutPage}<footer className="footer"><span>© 2026 TrafficIQ · Traffic Congestion Prediction</span><span><span className="status-dot"/> ML API <strong>LOCAL</strong></span></footer></main></div>;
}
