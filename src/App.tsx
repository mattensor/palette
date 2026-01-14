import './App.css'
import { Editor } from './components/Editor'
import { Sidebar } from './components/Sidebar'
import styles from './styles.module.css'

function App() {
  return (
    <div className={styles.app}>
      <Sidebar />
      <Editor />
    </div>
  )
}

export default App
