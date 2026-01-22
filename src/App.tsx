import "./App.css"
import { EditorCanvas } from "@/components/EditorCanvas"
import styles from "./styles.module.css"

function App() {
	return (
		<div className={styles.app}>
			<EditorCanvas />
		</div>
	)
}

export default App
