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
	form.appendChild(textarea);

	const submitButton = document.createElement("button");
	submitButton.innerText = "Submit";
	textarea.style.display = "block";
	submitButton.style.display = "block";
	form.appendChild(submitButton);


	const cancelButton = document.createElement("button");
	cancelButton.innerText = "Cancel";
	textarea.style.display = "block";
	cancelButton.style.display = "block";
	cancelButton.type="button";
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
	if (!input || !input.trim().length) { return; }
	const results = input.split("\n\n").map(entry => ({ entry: entry, error: submitTimeEntry(entry, true) }));
	const errors = results.filter(r => !!r.error);
	if (errors.length) {
		alert("Errors found: \n" + errors.map(r => r.entry + "\n!! " + r.error + " !!").join("\n\n"));
	} else {
		Promise.all(results.map(r => submitTimeEntry(r.entry, false))).then(() => window.location.reload(),
			errors => alert("Some entries failed to submit:\n" + errors.join("\n\n")))
	}
}

function submitTimeEntry(input, dryrun) {
	if (!input || !input.trim().length) { return; }
	let [ description, timeString ] = input.trim().replace(/[\s\r\n]+/g, " ").split(/ Scheduled: /i);
	const ticketMatch = description.match(/^\s*([a-zA-Z0-9\-]+)\s*:/);
	const projectActivityMatch = description.match(/#\s*([^/]*)\s*(?:\/\s*(.*)\s*)?$/);
	description = description.replace(/#.*$/, "");

	/* Handle project pattern */
	if (!projectActivityMatch) { return "No project tag"; }
	const desiredProjectOption = $("#project option").toArray().find(
		o => o.text.toLowerCase().indexOf(projectActivityMatch[ 1 ].toLowerCase().trim()) >= 0);
	if (desiredProjectOption) {
		$("#project").val(desiredProjectOption.value);
		$("#project").change();
	} else {return "Project tag #" + projectActivityMatch[ 1 ] + " did not match any projects";}
	const [ dateStr, startStr, endStr ] = timeString.split(/\s*at\s*|\s*to\s*/g);

	/* Add ticket number */
	$("#ticket").val(ticketMatch ? ticketMatch[ 1 ] : "");

	/* Handle activity */
	let desiredActivityOption;
	if (projectActivityMatch[ 2 ]) {
		desiredActivityOption = $("#activity option").toArray().find(
			o => o.text.toLowerCase().indexOf(projectActivityMatch[ 2 ].toLowerCase().trim()) >= 0);
	} else {
		const activityPattern = !!description.match(/meeting|planning|storytime|review|retro/i)
			? /meeting/i
			: !!description.match(/backend/i) ? /backend/i : defaultActivityPattern;
		desiredActivityOption = $("#activity option").toArray().find(o => o.text.match(activityPattern));
	}

	if (desiredActivityOption) {
		$("#activity").val(desiredActivityOption.value);
		$("#activity").change();
		/* Fire change event so the UI is updated */
	} else {
		if (projectActivityMatch[ 2 ]) {
			return "Unable to find correct activity for: " + projectActivityMatch[ 2 ];
		} else {
			return "Unable to find correct activity."
		}
	}

	$("#note").val(description);
	$("#id_date").val(dateStr);
	$("#startTime").val(startStr);
	$("#endTime").val(endStr);

	if (!dryrun) {
		const iframe = document.createElement("iframe");
		iframe.id = iframe.name = "iframe-" + Math.random();
		document.body.appendChild(iframe);
		$("#endTime")[ 0 ].form.target = iframe.id;
		$("#endTime")[ 0 ].form.submit();
		return new Promise((resolve, reject) => {
			iframe.onload = () => resolve(input);
			iframe.onerror = () => reject(input);
		});
	}
}