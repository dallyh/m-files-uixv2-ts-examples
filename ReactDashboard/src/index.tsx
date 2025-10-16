import { type IDashboard, Event } from "@m-filescorporation/uix-extensions";
import React from "react";
import { createRoot } from "react-dom/client";

type DashboardProps = {
	dashboard: IDashboard;
};

const Dashboard: React.FC<DashboardProps> = ({ dashboard }) => {
	const { ShellFrame } = dashboard;

	const [path, setPath] = React.useState(String(ShellFrame!.CurrentPath));

	React.useEffect(() => {
		let startedId: number | undefined;
		let locationId: number | undefined;

		const update = () => setPath(String(ShellFrame!.CurrentPath));

		(async () => {
			// Ensure we update once the ShellFrame is ready.
			startedId = await ShellFrame!.Events.Register(Event.Started, update);

			// React whenever the view location (path) changes.
			locationId = await ShellFrame!.Events.Register(Event.ViewLocationChanged, update);

			// Set initial value immediately, too.
			update();
		})();

		return () => {
			if (startedId !== undefined) ShellFrame!.Events.Unregister(startedId);
			if (locationId !== undefined) ShellFrame!.Events.Unregister(locationId);
		};
	}, [ShellFrame]);

	const showDefaultContent = () => {
		ShellFrame!.ShowDefaultContent();
	};

	return (
		<div className="dash mf-border-radius-panel mf-drop-shadow-light mf-bg-color-white">
			<h1>My dashboard</h1>
			<div>
				Current path: <span className="label">{path}</span>
			</div>
			<button className="mf-button mf-button-primary" type="button" onClick={showDefaultContent}>
				Show default Content
			</button>
		</div>
	);
};

// Register the dashboard event - creates a React app dashboard
window.OnNewDashboard = (newDashboard: IDashboard) => {
	const rootEl = document.getElementById("root");
	if (!rootEl) throw new Error("Root element #root not found");

	const root = createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<Dashboard dashboard={newDashboard} />
		</React.StrictMode>,
	);
};
