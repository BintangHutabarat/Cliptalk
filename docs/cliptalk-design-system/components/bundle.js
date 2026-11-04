/* @ds-bundle: {"format":4,"namespace":"ClipTalk","components":[{"name":"Button"},{"name":"Badge"},{"name":"Icon"},{"name":"Card"},{"name":"Input"},{"name":"Switch"},{"name":"SegmentedControl"},{"name":"Stepper"},{"name":"AppHeader"},{"name":"Dropzone"},{"name":"FileRow"},{"name":"SettingRow"},{"name":"RangeBar"},{"name":"TranscriptLine"},{"name":"SegmentCandidate"},{"name":"JobProgress"},{"name":"ClipFrame"},{"name":"SpecList"},{"name":"Notice"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var r = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) r[k] = obj[k];
    return r;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function timecode(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec / 60) % 60) + ':' + pad(sec % 60);
  }
  function shortTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    return pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
  }

  var PATHS = {
    upload: ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15'],
    film: ['M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4z', 'M7 4v16', 'M17 4v16', 'M3 9h4', 'M3 15h4', 'M17 9h4', 'M17 15h4'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    play: ['M8 5.5v13l10-6.5z'],
    download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M4 20h16'],
    back: ['M19 12H5', 'M11 6l-6 6 6 6'],
    close: ['M6 6l12 12', 'M18 6L6 18'],
    info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 7.5h.01'],
    alert: ['M12 3.5l9 16H3z', 'M12 10v4', 'M12 17h.01'],
    scissors: ['M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8.3 7.8L20 19', 'M8.3 16.2L20 5'],
    captions: ['M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5z', 'M7 13.5h4', 'M13.5 13.5H17', 'M7 10h10']
  };

  function Icon(props) {
    var size = props.size || 16;
    var d = PATHS[props.name] || PATHS.info;
    var filled = props.name === 'play';
    return h('svg', {
      className: cx('ct-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1.75,
      strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': props.label ? undefined : 'true',
      role: props.label ? 'img' : undefined, 'aria-label': props.label
    }, d.map(function (p, i) { return h('path', { key: i, d: p }); }));
  }

  function Button(props) {
    var variant = props.variant || 'primary';
    var size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'icon', 'iconRight', 'className', 'children']);
    var iconOnly = props.icon && !props.children;
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('ct-btn', 'ct-btn--' + variant, size !== 'md' && 'ct-btn--' + size, iconOnly && 'ct-btn--icon', props.className)
    }),
      props.icon ? h(Icon, { name: props.icon }) : null,
      props.children,
      props.iconRight ? h(Icon, { name: props.iconRight }) : null
    );
  }

  function Badge(props) {
    return h('span', { className: cx('ct-badge', 'ct-badge--' + (props.tone || 'neutral'), props.mono && 'ct-badge--mono', props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 12 }) : null, props.children);
  }

  function Card(props) {
    var head = (props.title || props.action) ? h('div', { className: 'ct-card-head' },
      h('div', null,
        props.title ? h('h3', { className: 'ct-card-title' }, props.title) : null,
        props.description ? h('p', { className: 'ct-card-desc' }, props.description) : null),
      props.action || null) : null;
    return h('section', { className: cx('ct-card', props.className) },
      head,
      h('div', { className: cx('ct-card-body', props.flush && 'ct-card-body--flush') }, props.children),
      props.footer ? h('div', { className: 'ct-card-foot' }, props.footer) : null);
  }

  function Input(props) {
    var id = props.id || 'ct-input';
    var len = (props.value || '').length;
    var over = props.maxLength && len > props.maxLength;
    var rest = omit(props, ['label', 'hint', 'error', 'maxLength', 'className', 'id']);
    return h('div', { className: cx('ct-field', props.className) },
      h('div', { className: 'ct-field-top' },
        h('label', { className: 'ct-label', htmlFor: id }, props.label),
        props.maxLength ? h('span', { className: cx('ct-count', over && 'ct-count--over') }, len + '/' + props.maxLength) : null),
      h('input', Object.assign({ className: 'ct-input', id: id, 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': id + '-hint' }, rest)),
      (props.error || props.hint) ? h('p', { className: cx('ct-hint', props.error && 'ct-hint--error'), id: id + '-hint' }, props.error || props.hint) : null);
  }

  function Switch(props) {
    var id = props.id || 'ct-switch';
    var btn = h('button', {
      type: 'button', role: 'switch', id: id, className: 'ct-switch', 'aria-checked': props.checked ? 'true' : 'false',
      'aria-labelledby': props.label ? id + '-l' : undefined, 'aria-label': props.label ? undefined : props.ariaLabel,
      onClick: function () { if (props.onChange) props.onChange(!props.checked); }
    });
    if (!props.label) return btn;
    return h('div', { className: 'ct-switch-row' },
      h('div', { className: 'ct-setting-text' },
        h('span', { className: 'ct-setting-title', id: id + '-l' }, props.label),
        props.description ? h('span', { className: 'ct-setting-desc' }, props.description) : null),
      btn);
  }

  function SegmentedControl(props) {
    return h('div', { className: 'ct-seg', role: 'radiogroup', 'aria-label': props.ariaLabel },
      (props.options || []).map(function (o) {
        var on = o.value === props.value;
        return h('button', {
          key: o.value, type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', className: 'ct-seg-opt',
          onClick: function () { if (props.onChange) props.onChange(o.value); }
        }, o.label);
      }));
  }

  var FLOW = ['Unggah', 'Pilih bagian', 'Pratinjau', 'Unduh'];

  function Stepper(props) {
    var steps = props.steps || FLOW;
    var current = props.current || 1;
    var items = [];
    steps.forEach(function (s, i) {
      var n = i + 1;
      var state = n < current ? 'done' : n === current ? 'current' : 'todo';
      if (i > 0) items.push(h('li', { key: 'sep' + n, className: 'ct-step-sep', 'aria-hidden': 'true' }));
      items.push(h('li', { key: n, className: cx('ct-step', 'ct-step--' + state), 'aria-current': state === 'current' ? 'step' : undefined },
        h('span', { className: 'ct-step-n' }, state === 'done' ? h(Icon, { name: 'check', size: 12 }) : n),
        h('span', { className: 'ct-step-label' }, s)));
    });
    return h('ol', { className: 'ct-steps', 'aria-label': 'Langkah' }, items);
  }

  function Wordmark() {
    return h('a', { className: 'ct-wordmark', href: '#' },
      h('svg', { width: 20, height: 20, viewBox: '0 0 20 20', 'aria-hidden': 'true' },
        h('rect', { className: 'ct-mark-range', x: 6, y: 6, width: 8, height: 8, rx: 1 }),
        h('path', { className: 'ct-mark-edge', d: 'M5 3H3v14h2M15 3h2v14h-2', fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' })),
      'ClipTalk');
  }

  function AppHeader(props) {
    return h('header', { className: 'ct-header' },
      h(Wordmark),
      props.current ? h(Stepper, { current: props.current, steps: props.steps }) : h('span'),
      h('span', { className: 'ct-avatar', 'aria-label': 'Akun' }, props.initials || 'NP'));
  }

  function Dropzone(props) {
    var st = React.useState(false), over = st[0], setOver = st[1];
    var id = props.id || 'ct-file';
    function pick(files) { if (files && files[0] && props.onFile) props.onFile(files[0]); }
    return h('div', {
      className: cx('ct-drop', over && 'ct-drop--over'),
      onDragOver: function (e) { e.preventDefault(); setOver(true); },
      onDragLeave: function () { setOver(false); },
      onDrop: function (e) { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }
    },
      h(Icon, { name: 'upload', size: 24 }),
      h('p', { className: 'ct-drop-title' }, over ? 'Lepaskan untuk mengunggah' : 'Tarik video podcast ke sini'),
      h('label', { className: 'ct-btn ct-btn--outline ct-btn--sm', htmlFor: id }, 'Pilih dari komputer'),
      h('input', { className: 'ct-drop-input', id: id, type: 'file', accept: 'video/mp4,video/quicktime,video/webm', onChange: function (e) { pick(e.target.files); } }),
      h('p', { className: 'ct-hint' }, props.hint || 'MP4, MOV, atau WebM. Maksimal 2 GB.'));
  }

  function FileRow(props) {
    return h('div', { className: 'ct-file' },
      h(Icon, { name: 'film', size: 20 }),
      h('div', { style: { display: 'grid', minWidth: 0, flex: 1 } },
        h('span', { className: 'ct-file-name' }, props.name),
        h('span', { className: 'ct-file-meta' },
          h('span', { className: 'ct-tc' }, props.duration),
          h('span', { className: 'ct-tc' }, props.size))),
      props.status || null,
      props.onRemove ? h(Button, { variant: 'destructive', size: 'sm', onClick: props.onRemove }, 'Hapus') : null);
  }

  function SettingRow(props) {
    return h('div', { className: 'ct-setting' },
      h('div', { className: 'ct-setting-text' },
        h('span', { className: 'ct-setting-title', id: props.id }, props.title),
        props.description ? h('span', { className: 'ct-setting-desc' }, props.description) : null),
      props.children);
  }

  function RangeBar(props) {
    var total = props.total || 1;
    var l = (props.start / total) * 100, w = ((props.end - props.start) / total) * 100;
    var bar = h('div', {
      className: cx('ct-rangebar', props.compact && 'ct-rangebar--compact'), role: 'img',
      'aria-label': 'Rentang ' + timecode(props.start) + ' sampai ' + timecode(props.end) + ' dari ' + timecode(total)
    },
      h('div', { className: 'ct-rangebar-track' }),
      h('div', { className: 'ct-rangebar-sel', style: { left: l + '%', width: w + '%' } }),
      props.playhead != null ? h('div', { className: 'ct-rangebar-head', style: { left: (props.playhead / total) * 100 + '%' } }) : null);
    if (!props.ticks) return bar;
    return h('div', { style: { display: 'grid', gap: '4px' } }, bar,
      h('div', { className: 'ct-rangebar-ticks' }, h('span', null, '00:00:00'), h('span', null, timecode(total / 2)), h('span', null, timecode(total))));
  }

  function TranscriptLine(props) {
    return h('button', {
      type: 'button', className: cx('ct-line', props.inRange && 'ct-line--in', props.playing && 'ct-line--playing'),
      onClick: props.onSelect, 'aria-current': props.playing ? 'true' : undefined
    },
      h('span', { className: 'ct-line-time' }, timecode(props.time)),
      h('span', null,
        props.speaker ? h('span', { className: 'ct-line-speaker' }, props.speaker) : null,
        h('span', { className: 'ct-line-text' }, props.text)));
  }

  function SegmentCandidate(props) {
    var dur = Math.round(props.end - props.start);
    return h('button', { type: 'button', role: 'radio', 'aria-checked': props.selected ? 'true' : 'false', className: 'ct-cand', onClick: props.onSelect },
      h('span', { className: 'ct-cand-radio', 'aria-hidden': 'true' }),
      h('span', { className: 'ct-cand-body' },
        h('span', { className: 'ct-cand-title' }, props.title),
        h('span', { className: 'ct-cand-meta' },
          h('span', { className: 'ct-cand-range' }, timecode(props.start) + ' – ' + timecode(props.end)),
          h('span', null, dur + ' dtk')),
        props.total ? h(RangeBar, { total: props.total, start: props.start, end: props.end, compact: true }) : null),
      props.score != null ? h(Badge, { tone: props.score >= 90 ? 'range' : 'outline', mono: true }, 'Skor ' + props.score) : null);
  }

  function JobProgress(props) {
    var stages = props.stages || [];
    return h('div', { className: 'ct-job' },
      h('div', { className: 'ct-job-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': props.percent || 0, 'aria-label': 'Progres pemrosesan' },
        h('div', { className: 'ct-job-fill', style: { width: (props.percent || 0) + '%' } })),
      h('ol', { className: 'ct-job-list' }, stages.map(function (s, i) {
        var dot = s.state === 'done' ? h(Icon, { name: 'check', size: 14 })
          : s.state === 'active' ? h('span', { className: 'ct-job-spin' })
          : s.state === 'error' ? h(Icon, { name: 'alert', size: 14 })
          : h('span', { className: 'ct-job-pending' });
        return h('li', { key: i, className: cx('ct-job-item', 'ct-job-item--' + (s.state || 'pending')) },
          h('span', { className: 'ct-job-dot' }, dot),
          h('span', null, s.label),
          s.meta ? h('span', { className: 'ct-job-time' }, s.meta) : null);
      })));
  }

  function ClipFrame(props) {
    var style = props.captionStyle || 'outline';
    var dur = props.duration || 44, cur = props.current || 0;
    return h('div', { className: cx('ct-frame', props.className), role: 'img', 'aria-label': 'Pratinjau klip vertikal 9:16' },
      h('div', { className: 'ct-frame-scene' }),
      props.onPlay ? h('button', { type: 'button', className: 'ct-frame-play', onClick: props.onPlay, 'aria-label': 'Putar' }, h(Icon, { name: 'play', size: 20 })) : null,
      props.caption && props.showCaption !== false ? h('div', { className: cx('ct-frame-cap', 'ct-frame-cap--' + style) }, h('span', null, props.caption)) : null,
      h('div', { className: 'ct-frame-bar' },
        h('div', { className: 'ct-frame-track' }, h('div', { className: 'ct-frame-progress', style: { width: (cur / dur) * 100 + '%' } })),
        h('div', { className: 'ct-frame-time' }, h('span', null, shortTime(cur)), h('span', null, shortTime(dur)))));
  }

  function SpecList(props) {
    return h('dl', { className: 'ct-specs' }, (props.items || []).map(function (it, i) {
      return h('div', { key: i, className: 'ct-spec' },
        h('dt', null, it.label),
        h('dd', { className: it.mono ? 'ct-tc' : undefined }, it.value));
    }));
  }

  function Notice(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('ct-notice', tone !== 'info' && 'ct-notice--' + tone), role: tone === 'error' ? 'alert' : 'status' },
      h(Icon, { name: tone === 'info' ? 'info' : 'alert' }),
      h('div', null, props.children));
  }

  var api = {
    Button: Button, Badge: Badge, Icon: Icon, Card: Card, Input: Input, Switch: Switch, SegmentedControl: SegmentedControl,
    Stepper: Stepper, AppHeader: AppHeader, Dropzone: Dropzone, FileRow: FileRow, SettingRow: SettingRow, RangeBar: RangeBar,
    TranscriptLine: TranscriptLine, SegmentCandidate: SegmentCandidate, JobProgress: JobProgress, ClipFrame: ClipFrame,
    SpecList: SpecList, Notice: Notice, timecode: timecode
  };
  window.ClipTalk = Object.assign(window.ClipTalk || {}, api);
})();
