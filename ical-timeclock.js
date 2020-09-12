// Time Entry Format:
// TICKET: Description #PROJECT/ACTIVITY
// TICKET is optional
// If no ACTIVITY is specified, it will default to `defaultActivity`

const defaultActivityPattern = /frontend/i;

showDialog();

function showDialog() {
	const form = document.createElement("form");
	const textarea = document.createElement("textarea");
	textarea.style.width = "100%";
	textarea.style.height = "25em";
	textarea.style.display = "block";
	form.appendChild(textarea);

	const submitButton = document.createElement("button");
	submitButton.innerText = "Submit";
	submitButton.style.display = "inline-block";
	form.appendChild(submitButton);

	const cancelButton = document.createElement("button");
	cancelButton.innerText = "Cancel";
	textarea.style.display = "block";
	cancelButton.style.display = "inline-block";
	cancelButton.type = "button";
	form.appendChild(cancelButton);
	cancelButton.onclick = () => {
		form.remove();
	};

	form.style.position = "fixed";
	form.style.left = "0";
	form.style.top = "0";
	form.style.width = "100%";
	form.style.height = "30em";
	form.style.background = "gray";
	form.style.padding = "1em";
	form.style.zIndex = 1000;

	form.onsubmit = (ev) => {
		ev.preventDefault();
		ev.stopPropagation();
		form.remove();

		fillFromCalendarInput(textarea.value);
	};

	document.body.appendChild(form);
	textarea.focus();
}

function fillFromCalendarInput(input) {
	if (!input || !input.trim().length) {
		return;
	}

	const results = input.split("\n\n").map(entry => ({entry: entry, error: submitTimeEntry(entry, true)}));
	const errors = results.filter(r => !!r.error);

	if (errors.length) {
		alert("Errors found: \n" + errors.map(r => r.entry + "\n!! " + r.error + " !!").join("\n\n"));
	} else {
		const allPromises = [];

		(async () => {
			for (let result of results) {
				allPromises.push(submitTimeEntry(result.entry, false));

				// Hack: Something changed around may 15th, 2020 that broke this script. Only the first entry would
				// be submitted in Chrome. My first thought was that it was a change to timeclock, but Nate reports that
				// Firefox works correctly. It's possible something changed in Chrome such that submitting a form
				// multiple time to multiple iframes in the same frame doesn't work anymore. In any case, this hack
				// fixes the issue.
				await new Promise(r => setTimeout(r, 100));
			}
		})()

		Promise.all(allPromises).then(
			() => {
				//window.location.reload();
			},
			errors => alert("Some entries failed to submit:\n" + errors.join("\n\n"))
		);
	}
}

function submitTimeEntry(input, dryrun) {
	if (!input || !input.trim().length) {
		return;
	}

	let [description, timeString] = input.trim().replace(/[\s\r\n]+/g, " ").split(/ Scheduled: /i);
	const ticketMatch = description.match(/^\s*([a-zA-Z0-9\-]+)\s*:/);
	const projectActivityMatch = description.match(/#\s*([^/]*)\s*(?:\/\s*(.*)\s*)?$/);
	description = description.replace(/#.*$/, "");

	// Handle project pattern
	if (!projectActivityMatch) {
		return "No project tag";
	}

	const desiredProjectOption = $("#project option").toArray().find(
		o => o.text.toLowerCase().indexOf(projectActivityMatch[1].toLowerCase().trim()) >= 0);

	if (desiredProjectOption) {
		$("#project").val(desiredProjectOption.value);
		$("#project").change();
	} else {
		return "Project tag #" + projectActivityMatch[1] + " did not match any projects";
	}

	const [dateStrRaw, startStrRaw, endStrRaw] = timeString.split(/\s*at\s*|\s*to\s*/g);
	
	const dateStr = normalizeDateString(dateStrRaw);

	const startStr = normalizeTimeString(startStrRaw);
	const endStr = normalizeTimeString(endStrRaw);

	if (! startStr) {
		return `Start Time String '${startStrRaw}' does not conform to 'HH:MM' or 'hh:mm aa'`;
	}

	if (! endStr) {
		return `End Time String '${endStrRaw}' does not conform to 'HH:MM' or 'hh:mm aa'`;
	}

	// Add ticket number
	$("#ticket").val(ticketMatch ? ticketMatch[1] : "");

	// Handle activity
	let desiredActivityOption;
	if (projectActivityMatch[2]) {
		desiredActivityOption = $("#activity option").toArray().find(
			o => o.text.toLowerCase().indexOf(projectActivityMatch[2].toLowerCase().trim()) >= 0);
	} else {
		const activityPattern = !!description.match(/meeting|planning|storytime|review|retro/i)
			? /meeting/i
			: !!description.match(/backend/i) ? /backend/i : defaultActivityPattern;
		desiredActivityOption = $("#activity option").toArray().find(o => o.text.match(activityPattern));
	}

	if (desiredActivityOption) {
		$("#activity").val(desiredActivityOption.value);

		// Fire change event so the UI is updated
		$("#activity").change();
	} else {
		if (projectActivityMatch[2]) {
			return "Unable to find correct activity for: " + projectActivityMatch[2];
		} else {
			return "Unable to find correct activity."
		}
	}


	$("#note").val(description);
	$("#id_date").val(dateStr);
	$("#startTime").val(startStr);
	$("#endTime").val(endStr);

	if (! dryrun) {
		const iframe = document.createElement("iframe");
		iframe.id = iframe.name = "iframe-" + Math.random();
		document.body.appendChild(iframe);

		$("#endTime")[0].form.target = iframe.id;
		$("#endTime")[0].form.submit();

		return new Promise((resolve, reject) => {
			iframe.onload = () => {
				console.info("Frame loaded for " + input);
				resolve(input);
			}
			iframe.onerror = () => reject(input);
		});
	}
}

/**
 * Normalizes time strings that might be in 12-hour format to conform to the HTML input standard of a 24-hour string.
 */
function normalizeTimeString(input) {
	input = input.trim();

	const match12 = input.match(/(\d?\d):(\d?\d)(?::\d?\d)? (AM|PM)/i);

	if (match12) {
		const hours = parseInt(match12[1]);
		const minutes = parseInt(match12[2]);
		const ampm = match12[3];

		function pad(n) {
			return n < 10 ? `0${n}` : `${n}`
		}

		if (ampm.toLowerCase() === "pm" && hours !== 12) {
			return `${pad(hours + 12)}:${pad(minutes)}`;
		} else {
			return `${pad(hours)}:${pad(minutes)}`;
		}
	} else if (input.match(/(\d?\d):(\d?\d)(?::\d?\d)?/)) {
		return input;
	} else {
		return null;
	}
}

function normalizeDateString(dateStr) {
	return (new Date(dateStr)).toISOString().substr(0,10);
}
