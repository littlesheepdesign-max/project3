(function () {
  const MAX_FIELDS = 10;

  const inputsContainer = document.getElementById('inputsContainer');
  const addFieldBtn = document.getElementById('addFieldBtn');
  const clearBtn = document.getElementById('clearBtn');
  const startBtn = document.getElementById('startBtn');
  const entryCountBadge = document.getElementById('entryCountBadge');
  const statusText = document.getElementById('statusText');
  const spinStatus = document.getElementById('spinStatus');

  const wheel = document.getElementById('wheel');
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const needle = document.getElementById('needle');

  const questionInput = document.getElementById('questionInput');
  const questionDisplay = document.getElementById('questionDisplay');

  const overlay = document.getElementById('winnerOverlay');
  const overlayQuestionEl = document.getElementById('overlayQuestion');
  const winnerNameEl = document.getElementById('winnerName');
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');

  let isSpinning = false;
  let entries = [];
  let currentRotation = 0; // in degrees, growing clockwise only

  function resizeCanvas() {
	const rect = canvas.getBoundingClientRect();
	const size = Math.min(rect.width, rect.height);
	canvas.width = size * window.devicePixelRatio;
	canvas.height = size * window.devicePixelRatio;
	ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
	drawWheel();
  }

  window.addEventListener('resize', resizeCanvas);

  function updateEntryCount() {
	const textInputs = Array.from(inputsContainer.querySelectorAll('input'));
	entries = textInputs
	  .map(input => input.value.trim())
	  .filter(v => v.length > 0);
	entryCountBadge.textContent = `${entries.length} / ${MAX_FIELDS}`;
	statusText.textContent = entries.length === 0
	  ? 'Waiting for entries'
	  : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} ready`;
	spinStatus.textContent = isSpinning
	  ? 'Spinning'
	  : (entries.length > 0 ? 'Ready' : 'Add names');

	wheel.className = `wheel segments-${entries.length}`;
	drawWheel();
  }

  function addField(value = '') {
	const currentCount = inputsContainer.querySelectorAll('.input-row').length;
	if (currentCount >= MAX_FIELDS) return;

	const row = document.createElement('div');
	row.className = 'input-row';

	const input = document.createElement('input');
	input.type = 'text';
	input.placeholder = `Entry ${currentCount + 1}`;
	input.value = value;

	const removeBtn = document.createElement('button');
	removeBtn.type = 'button';
	removeBtn.textContent = '×';
	removeBtn.title = 'Remove';

	removeBtn.addEventListener('click', () => {
	  if (isSpinning) return;
	  row.remove();
	  renumberPlaceholders();
	  toggleAddButtonState();
	  updateEntryCount();
	});

	input.addEventListener('input', () => {
	  updateEntryCount();
	});

	row.appendChild(input);
	row.appendChild(removeBtn);
	inputsContainer.appendChild(row);

	toggleAddButtonState();
	updateEntryCount();
  }

  function renumberPlaceholders() {
	Array.from(inputsContainer.querySelectorAll('input')).forEach((input, i) => {
	  input.placeholder = `Entry ${i + 1}`;
	});
  }

  function toggleAddButtonState() {
	const count = inputsContainer.querySelectorAll('.input-row').length;
	addFieldBtn.disabled = count >= MAX_FIELDS;
  }

  function clearAll() {
	if (isSpinning) return;
	inputsContainer.innerHTML = '';
	questionInput.value = '';
	questionDisplay.textContent = '';
	addField();
	toggleAddButtonState();
	updateEntryCount();
  }

  function drawWheel() {
	const n = entries.length;
	const w = canvas.width / window.devicePixelRatio;
	const h = canvas.height / window.devicePixelRatio;
	const cx = w / 2;
	const cy = h / 2;
	const radius = Math.min(w, h) / 2;

	ctx.clearRect(0, 0, w, h);

	if (n === 0) {
	  ctx.beginPath();
	  ctx.arc(cx, cy, radius * 0.9, 0, 2 * Math.PI);
	  const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 0.9);
	  grad.addColorStop(0, '#f3f4f6');
	  grad.addColorStop(1, '#e5e7eb');
	  ctx.fillStyle = grad;
	  ctx.fill();
	  return;
	}

	const colors = [
	  '#f97373', '#facc15', '#38bdf8', '#a855f7', '#4ade80',
	  '#fb923c', '#ef4444', '#22c55e', '#e879f9', '#fde047'
	];

	const anglePer = (2 * Math.PI) / n;

	for (let i = 0; i < n; i++) {
	  const startAngle = i * anglePer - Math.PI / 2;
	  const endAngle = startAngle + anglePer;
	  ctx.beginPath();
	  ctx.moveTo(cx, cy);
	  ctx.arc(cx, cy, radius * 0.9, startAngle, endAngle);
	  ctx.closePath();
	  ctx.fillStyle = colors[i % colors.length];
	  ctx.fill();

	  const midAngle = (startAngle + endAngle) / 2;
	  const textRadius = radius * 0.58;
	  const tx = cx + Math.cos(midAngle) * textRadius;
	  const ty = cy + Math.sin(midAngle) * textRadius;

	  ctx.save();
	  ctx.translate(tx, ty);
	  ctx.rotate(midAngle + Math.PI / 2);
	  ctx.fillStyle = '#111827';
	  ctx.font = 'bold 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
	  ctx.textAlign = 'center';
	  ctx.textBaseline = 'middle';

	  const label = entries[i];
	  const maxWidth = radius * 0.8;
	  const truncated = truncateText(ctx, label, maxWidth);
	  ctx.fillText(truncated, 0, 0);
	  ctx.restore();
	}

	ctx.beginPath();
	ctx.arc(cx, cy, radius * 0.18, 0, 2 * Math.PI);
	ctx.fillStyle = '#e5e7eb';
	ctx.fill();
  }

  function truncateText(ctx, text, maxWidth) {
	if (!text) return '';
	if (ctx.measureText(text).width <= maxWidth) return text;

	let truncated = text;
	while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
	  truncated = truncated.slice(0, -1);
	}
	return truncated + '…';
  }

  function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
  }

function spin() {
  if (isSpinning) return;

  updateEntryCount();
  const n = entries.length;
  if (n === 0) {
    statusText.textContent = 'Add at least 1 entry';
    return;
  }

  questionDisplay.textContent = questionInput.value.trim();

  isSpinning = true;
  startBtn.disabled = true;
  clearBtn.disabled = true;
  addFieldBtn.disabled = true;
  questionInput.disabled = true;
  Array.from(inputsContainer.querySelectorAll('input, button')).forEach(el => {
    el.disabled = true;
  });

  statusText.textContent = 'Spinning…';
  spinStatus.textContent = 'Spinning';

  const duration = randomInt(3000, 10000);
  const minSpins = 4;
  const extraSpins = Math.random() * 4;

  const nSegments = n;
  const anglePerSegment = 360 / nSegments;

  // 1) Choose the winner
  const winningIndex = randomInt(0, nSegments - 1);

  // 2) Segment center in wheel coordinates, matching drawWheel():
  //    startAngleDeg = i * anglePerSegment - 90
  //    center = start + anglePerSegment / 2
  const segmentCenterAngleFromUp =
    winningIndex * anglePerSegment - 90 + anglePerSegment / 2;

  // 3) Needle 0deg = down, "up" = -90° (already in segmentCenterAngleFromUp)
  //    so we only need to convert from "up" to needle's 0=down -> +180deg
  const fineTune = 0;           // tweak to 1 or -1 if tip slightly off visually
  const visualOffset = 180 + fineTune;

  // 4) Absolute target angle
  const baseSpins = (minSpins + extraSpins) * 360;
  const targetAbsoluteAngle =
    baseSpins + segmentCenterAngleFromUp + visualOffset;

  needle.classList.add('spinning');
  void needle.offsetWidth;

  // Reset to 0deg for each spin to avoid drift
  needle.style.transition = 'none';
  needle.style.transform = 'translate(-50%, -50%) rotate(0deg)';
  void needle.offsetWidth;
  needle.style.transition =
    `transform ${duration}ms cubic-bezier(0.12, 0.01, 0.12, 1)`;

  needle.style.transform =
    `translate(-50%, -50%) rotate(${targetAbsoluteAngle}deg)`;

  const onTransitionEnd = () => {
    needle.removeEventListener('transitionend', onTransitionEnd);
    needle.classList.remove('spinning');

    const winner = entries[winningIndex];

    isSpinning = false;
    startBtn.disabled = false;
    clearBtn.disabled = false;
    toggleAddButtonState();
    questionInput.disabled = false;
    Array.from(inputsContainer.querySelectorAll('input, button')).forEach(el => {
      el.disabled = false;
    });

    statusText.textContent = 'Result ready';
    spinStatus.textContent = 'Ready';

    showWinnerOverlay(winner);
  };

  needle.addEventListener('transitionend', onTransitionEnd, { once: true });
}

  function showWinnerOverlay(name) {
	const question = questionInput.value.trim();
	overlayQuestionEl.textContent = question || '';
	winnerNameEl.textContent = name || '(empty)';
	overlay.classList.add('active');
  }

  function closeOverlay() {
	overlay.classList.remove('active');
  }

  // Event bindings
  addFieldBtn.addEventListener('click', () => addField());
  clearBtn.addEventListener('click', clearAll);
  startBtn.addEventListener('click', spin);
  closeOverlayBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
	if (e.target === overlay) closeOverlay();
  });

  document.addEventListener('keydown', (e) => {
	if (e.key === 'Enter' && !isSpinning) {
	  const active = document.activeElement;
	  if (active && active.tagName === 'INPUT') {
		spin();
	  }
	}
  });

  questionInput.addEventListener('input', () => {
	questionDisplay.textContent = questionInput.value.trim();
  });

  // Initialize
  addField();
  addField();
  resizeCanvas();
})();






