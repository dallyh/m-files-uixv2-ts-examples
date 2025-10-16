import { Event, IShellUI, IShellFrame } from "@m-filescorporation/uix-extensions";

/// <reference path="./types/mfiles.d.ts" />

// NOTE! This code is for demonstration purposes only and does not contain any kind of
//       error handling. MUST be revised before using in production.

/**
 * Executed by the UIX when a ShellUI module is started.
 * @param shellUI The shell UI object which was created.
 */
function OnNewShellUI(shellUI: IShellUI): void {
	// This is the start point of a ShellUI module.

	// Register to be notified when a new normal shell frame is created.
	// We use Event.NewShellFrame as this won't fire for history (etc.) dialogs.
	shellUI.Events.Register(Event.NewShellFrame, handleNewShellFrame);
}

/**
 * Handles the OnNewShellFrame event for an IShellUI.
 * @param shellFrame The shell frame object which was created.
 */
function handleNewShellFrame(shellFrame: IShellFrame): void {
	// The shell frame was created but it cannot be used yet.
	// The following line would throw an exception ("The object cannot be accessed, because it is not ready."):
	// shellFrame.ShowMessage("A shell frame was created");

	// Register to be notified when the shell frame is started.
	// This time pass a reference to the function to call when the event is fired.
	shellFrame.Events.Register(Event.Started, getShellFrameStartedHandler(shellFrame));
}

/**
 * Returns a function which handles the OnStarted event for an IShellFrame.
 * @param shellFrame The shell frame to show the message in.
 * @returns A function that handles the started event.
 */
function getShellFrameStartedHandler(shellFrame: IShellFrame): () => Promise<void> {
	return async (): Promise<void> => {
		// The shell frame is now started and can be used.
		await shellFrame.ShowMessage("A shell frame is available for use.");
	};
}

// Make OnNewShellUI available globally
window.OnNewShellUI = OnNewShellUI;
