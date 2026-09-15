/* @ds-bundle: {"format":4,"namespace":"SolvikDesignSystem_b39a97","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardDivider","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"TogglePill","sourcePath":"components/core/TogglePill.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"BottomSheet","sourcePath":"components/map/BottomSheet.jsx"},{"name":"SheetKeyframes","sourcePath":"components/map/BottomSheet.jsx"},{"name":"MapCanvas","sourcePath":"components/map/MapCanvas.jsx"},{"name":"AppHeader","sourcePath":"components/navigation/AppHeader.jsx"},{"name":"SegmentedTabs","sourcePath":"components/navigation/SegmentedTabs.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"ArrivalRow","sourcePath":"components/transit/ArrivalRow.jsx"},{"name":"CrowdingMeter","sourcePath":"components/transit/CrowdingMeter.jsx"},{"name":"CrowdingLegend","sourcePath":"components/transit/CrowdingMeter.jsx"},{"name":"PromptCard","sourcePath":"components/transit/PromptCard.jsx"},{"name":"SectionLabel","sourcePath":"components/transit/ServiceStatus.jsx"},{"name":"ServiceStatus","sourcePath":"components/transit/ServiceStatus.jsx"},{"name":"TripCard","sourcePath":"components/transit/TripCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"48038eb01057","components/core/Button.jsx":"e8eeaa7a6818","components/core/Card.jsx":"a23cc246e37f","components/core/Icon.jsx":"dda53c83df5b","components/core/IconButton.jsx":"c62590c966c3","components/core/Tag.jsx":"bd7a5f2e9e57","components/core/TogglePill.jsx":"994b5b597de2","components/forms/SearchField.jsx":"9500b14776ba","components/map/BottomSheet.jsx":"c51fb7455910","components/map/MapCanvas.jsx":"a3a2d1599c19","components/navigation/AppHeader.jsx":"d42e2b100982","components/navigation/SegmentedTabs.jsx":"018d331cf1f4","components/navigation/TabBar.jsx":"b6405da8ebb3","components/transit/ArrivalRow.jsx":"14bbc2923ee0","components/transit/CrowdingMeter.jsx":"480290d61ce3","components/transit/PromptCard.jsx":"2eb08a70c745","components/transit/ServiceStatus.jsx":"d3ef391ff22f","components/transit/TripCard.jsx":"caa9461a4c2f","ui_kits/solvik-app/AppShell.jsx":"38b87f2a2c1f","ui_kits/solvik-app/LiveScreen.jsx":"2b9ad59a8e04","ui_kits/solvik-app/MapScreen.jsx":"8502c665b694","ui_kits/solvik-app/PlanScreen.jsx":"86cbf62216ed","ui_kits/solvik-app/data.js":"6df0d541fa92"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SolvikDesignSystem_b39a97 = window.SolvikDesignSystem_b39a97 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  accent: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)'
  },
  dark: {
    background: 'var(--surface-dark)',
    color: 'var(--text-on-dark)'
  },
  soft: {
    background: 'var(--accent-soft)',
    color: 'var(--text-accent)'
  },
  neutral: {
    background: 'var(--surface-sunken)',
    color: 'var(--text-body)'
  },
  warn: {
    background: 'var(--amber-100)',
    color: 'var(--rust-700)'
  },
  alert: {
    background: 'var(--rust-100)',
    color: 'var(--rust-700)'
  }
};
function Badge({
  children,
  tone = 'accent',
  size = 'md',
  style,
  ...rest
}) {
  const t = tones[tone] || tones.accent;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: sm ? 40 : 52,
      height: sm ? 24 : 30,
      padding: sm ? '0 9px' : '0 12px',
      borderRadius: 'var(--radius-pill)',
      background: t.background,
      color: t.color,
      font: `var(--weight-bold) ${sm ? '11px' : 'var(--size-caption)'}/1 var(--font-body)`,
      letterSpacing: '.04em',
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  tone = 'plain',
  padding = 'default',
  interactive = false,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const pad = padding === 'none' ? 0 : padding === 'tight' ? 'var(--pad-card-tight)' : 'var(--pad-card)';
  const tones = {
    plain: {
      background: 'var(--surface-card)',
      border: '1px solid transparent'
    },
    outlined: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-accent)'
    },
    hairline: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)'
    },
    accent: {
      background: 'var(--surface-accent)',
      border: '1px solid transparent'
    },
    dark: {
      background: 'var(--surface-dark)',
      border: '1px solid transparent'
    }
  };
  const t = tones[tone] || tones.plain;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => interactive && setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      background: t.background,
      border: t.border,
      borderRadius: 'var(--radius-card)',
      padding: pad,
      color: tone === 'dark' ? 'var(--text-on-dark)' : 'var(--text-body)',
      boxShadow: interactive && hover ? 'var(--shadow-raised)' : 'var(--shadow-card)',
      transform: press ? 'scale(var(--press-scale))' : interactive && hover ? 'translateY(var(--lift-hover))' : 'none',
      transition: 'box-shadow var(--dur-base) var(--ease-standard),transform var(--dur-fast) var(--ease-standard)',
      cursor: interactive ? 'pointer' : undefined,
      ...style
    }
  }, rest), children);
}
function CardDivider({
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--border-card)',
      margin: '14px 0',
      ...style
    }
  });
}
Object.assign(__ds_scope, { Card, CardDivider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Renders a Lucide glyph from the UMD global (window.lucide). Solvik uses
   Lucide outline icons at 2px stroke; see readme ICONOGRAPHY. */
function nodesFor(name) {
  const lib = typeof window !== 'undefined' && window.lucide && (window.lucide.icons || window.lucide);
  if (!lib) return null;
  const pascal = name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
  const node = lib[pascal] || lib[name];
  if (!node) return null;
  if (Array.isArray(node) && node[0] === 'svg') return node[2] || [];
  return Array.isArray(node) ? node : node.default || [];
}
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  title,
  style,
  ...rest
}) {
  const [, force] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => {
    if (nodesFor(name)) return;
    const t = setInterval(() => {
      if (nodesFor(name)) {
        clearInterval(t);
        force();
      }
    }, 120);
    const stop = setTimeout(() => clearInterval(t), 4000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [name]);
  const children = nodesFor(name) || [];
  return /*#__PURE__*/React.createElement("svg", _extends({
    "aria-hidden": title ? undefined : true,
    role: title ? 'img' : undefined,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: 'block',
      flex: 'none',
      ...style
    }
  }, rest), title ? /*#__PURE__*/React.createElement("title", null, title) : null, children.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const variants = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent',
    hover: 'var(--accent-hover)',
    press: 'var(--accent-press)'
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-strong)',
    border: '1px solid var(--border-hairline)',
    hover: 'var(--sand-100)',
    press: 'var(--sand-200)'
  },
  soft: {
    background: 'var(--accent-soft)',
    color: 'var(--text-accent)',
    border: '1px solid transparent',
    hover: 'var(--accent-soft-hover)',
    press: 'var(--green-300)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-strong)',
    border: '1px solid transparent',
    hover: 'var(--sand-200)',
    press: 'var(--sand-300)'
  },
  dark: {
    background: 'var(--surface-dark)',
    color: 'var(--text-on-dark)',
    border: '1px solid transparent',
    hover: 'var(--sand-800)',
    press: 'var(--sand-700)'
  }
};
const sizes = {
  sm: {
    height: 34,
    padding: '0 14px',
    font: 'var(--weight-bold) var(--size-caption)/1 var(--font-body)',
    icon: 16,
    gap: 6
  },
  md: {
    height: 44,
    padding: '0 20px',
    font: 'var(--weight-bold) var(--size-body-sm)/1 var(--font-body)',
    icon: 18,
    gap: 8
  },
  lg: {
    height: 56,
    padding: '0 24px',
    font: 'var(--weight-bold) var(--size-subheading)/1 var(--font-body)',
    icon: 22,
    gap: 10
  }
};
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  const [state, setState] = React.useState('idle');
  const bg = disabled ? 'var(--sand-200)' : state === 'press' ? v.press : state === 'hover' ? v.hover : v.background;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setState('hover'),
    onMouseLeave: () => setState('idle'),
    onMouseDown: () => setState('press'),
    onMouseUp: () => setState('hover'),
    onBlur: () => setState('idle'),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: iconRight ? 'space-between' : 'center',
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      font: s.font,
      letterSpacing: 'var(--tracking-body)',
      background: bg,
      color: disabled ? 'var(--text-subtle)' : v.color,
      border: v.border,
      borderRadius: 'var(--radius-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-control)',
      transform: state === 'press' && !disabled ? 'scale(var(--press-scale))' : 'none',
      boxShadow: state === 'press' ? 'var(--shadow-press)' : 'none',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap
    }
  }, children), iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  plain: {
    background: 'var(--surface-card)',
    color: 'var(--text-strong)',
    border: '1px solid var(--border-hairline)',
    hover: 'var(--sand-100)'
  },
  soft: {
    background: 'var(--accent-soft)',
    color: 'var(--text-accent)',
    border: '1px solid transparent',
    hover: 'var(--accent-soft-hover)'
  },
  accent: {
    background: 'var(--accent)',
    color: 'var(--text-on-accent)',
    border: '1px solid transparent',
    hover: 'var(--accent-hover)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-strong)',
    border: '1px solid transparent',
    hover: 'var(--sand-200)'
  }
};
const boxes = {
  sm: 34,
  md: 44,
  lg: 52
};
function IconButton({
  icon,
  label,
  tone = 'plain',
  size = 'md',
  badge = false,
  onClick,
  disabled = false,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.plain;
  const box = boxes[size] || boxes.md;
  const [state, setState] = React.useState('idle');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setState('hover'),
    onMouseLeave: () => setState('idle'),
    onMouseDown: () => setState('press'),
    onMouseUp: () => setState('hover'),
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: box,
      height: box,
      borderRadius: 'var(--radius-pill)',
      background: state === 'idle' || disabled ? t.background : t.hover,
      color: disabled ? 'var(--text-subtle)' : t.color,
      border: t.border,
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-control)',
      transform: state === 'press' && !disabled ? 'scale(var(--press-scale))' : 'none',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(box * 0.45)
  }), badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 1,
      right: 1,
      width: 11,
      height: 11,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--accent)',
      border: '2px solid var(--surface-card)'
    }
  }) : null);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  soft: {
    background: 'var(--accent-soft)',
    color: 'var(--text-accent)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'var(--surface-card)',
    color: 'var(--text-accent)',
    border: '1px solid var(--border-hairline)'
  },
  neutral: {
    background: 'var(--surface-sunken)',
    color: 'var(--text-muted)',
    border: '1px solid transparent'
  },
  warn: {
    background: 'var(--amber-100)',
    color: 'var(--rust-700)',
    border: '1px solid transparent'
  }
};
function Tag({
  children,
  tone = 'soft',
  icon,
  onClick,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.soft;
  const [hover, setHover] = React.useState(false);
  const clickable = Boolean(onClick);
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 34,
      padding: '0 14px',
      borderRadius: 'var(--radius-pill)',
      background: t.background,
      border: t.border,
      color: t.color,
      font: 'var(--weight-bold) var(--size-caption)/1 var(--font-body)',
      letterSpacing: 'var(--tracking-micro)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      cursor: clickable ? 'pointer' : 'default',
      opacity: clickable && hover ? 0.82 : 1,
      transition: 'var(--transition-control)',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }) : null, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/core/TogglePill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TogglePill({
  children,
  icon,
  pressed = false,
  onChange,
  fullWidth = true,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-pressed": pressed,
    onClick: () => onChange && onChange(!pressed),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      display: 'flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      height: 50,
      padding: '0 20px',
      borderRadius: 'var(--radius-control)',
      background: pressed ? 'var(--accent-soft)' : hover ? 'var(--sand-100)' : 'var(--surface-card)',
      color: pressed ? 'var(--text-accent)' : 'var(--text-strong)',
      border: `1px solid ${pressed ? 'var(--border-accent)' : 'var(--border-hairline)'}`,
      font: 'var(--weight-bold) var(--size-body-sm)/1 var(--font-body)',
      cursor: 'pointer',
      transition: 'var(--transition-control)',
      transform: press ? 'scale(var(--press-scale))' : 'none',
      WebkitTapHighlightColor: 'transparent',
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }) : null, children);
}
Object.assign(__ds_scope, { TogglePill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TogglePill.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchField({
  value,
  placeholder = 'Where to?',
  icon = 'search',
  onChange,
  onClear,
  onSubmit,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 52,
      padding: '0 16px',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-control)',
      border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-hairline)'}`,
      boxShadow: focus ? 'var(--ring-focus)' : 'none',
      transition: 'box-shadow var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 19,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    placeholder: placeholder,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onKeyDown: e => {
      if (e.key === 'Enter' && onSubmit) onSubmit(value);
    },
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--weight-medium) var(--size-body)/1.2 var(--font-body)',
      color: 'var(--text-strong)'
    }
  }), value ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Clear",
    onClick: onClear,
    style: {
      display: 'flex',
      border: 'none',
      background: 'transparent',
      padding: 4,
      cursor: 'pointer',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 17
  })) : null);
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/map/BottomSheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function BottomSheet({
  children,
  elevated = true,
  grabber = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-sheet) var(--radius-sheet) var(--radius-sheet) var(--radius-sheet)',
      padding: 'var(--pad-card)',
      boxShadow: elevated ? 'var(--shadow-sheet)' : 'none',
      animation: 'solvik-sheet-in var(--dur-sheet) var(--ease-out) both',
      ...style
    }
  }, rest), grabber ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 4,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--border-strong)',
      margin: '0 auto 14px'
    }
  }) : null, children);
}
function SheetKeyframes() {
  return /*#__PURE__*/React.createElement("style", null, '@keyframes solvik-sheet-in{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}');
}
Object.assign(__ds_scope, { BottomSheet, SheetKeyframes });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/BottomSheet.jsx", error: String((e && e.message) || e) }); }

// components/map/MapCanvas.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Warm-toned map surface. Renders OpenStreetMap raster tiles through Leaflet
   when the Leaflet UMD global is present (see readme: the source screenshots
   use a live tile map; no proprietary basemap is bundled here). Falls back to
   a flat sand panel so the component never blocks a render. */
function MapCanvas({
  center = [1.3483, 103.6831],
  zoom = 15,
  route = [],
  marker,
  height = 320,
  interactive = false,
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const mapRef = React.useRef(null);
  React.useEffect(() => {
    const L = typeof window !== 'undefined' && window.L;
    if (!L || !ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: false
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);
    if (route.length > 1) {
      L.polyline(route, {
        color: getComputedStyle(document.documentElement).getPropertyValue('--map-route').trim() || '#437858',
        weight: 5,
        opacity: 1,
        dashArray: '1 11',
        lineCap: 'round'
      }).addTo(map);
    }
    if (marker) {
      L.circleMarker(marker, {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#201e1d',
        fillOpacity: 1
      }).addTo(map);
    }
    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(ref.current);
    }
    return () => {
      if (ro) ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      height,
      background: 'var(--map-land)',
      overflow: 'hidden',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'absolute',
      inset: 0,
      filter: 'saturate(.72) sepia(.12) brightness(1.03) contrast(.96)'
    }
  }));
}
Object.assign(__ds_scope, { MapCanvas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/map/MapCanvas.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AppHeader({
  title,
  subtitle,
  uppercase = false,
  action,
  sticky = true,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      position: sticky ? 'sticky' : 'relative',
      top: 0,
      zIndex: 5,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '18px var(--pad-screen) 16px',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-card)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      color: 'var(--text-strong)',
      font: uppercase ? 'var(--weight-heavy) var(--size-title)/1.1 var(--font-display)' : 'var(--type-display)',
      letterSpacing: 'var(--tracking-display)',
      textTransform: uppercase ? 'uppercase' : 'none',
      textWrap: 'pretty'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '6px 0 0',
      font: 'var(--weight-regular) var(--size-body-sm)/1.35 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, subtitle) : null), action ? /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      paddingTop: 2
    }
  }, action) : null);
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedTabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Filter row: green filled pill for the active option, mint ghost for the rest. */
function SegmentedTabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      ...style
    }
  }, rest), items.map(raw => {
    const item = typeof raw === 'string' ? {
      id: raw,
      label: raw
    } : raw;
    const active = item.id === value;
    return /*#__PURE__*/React.createElement(Segment, {
      key: item.id,
      item: item,
      active: active,
      onChange: onChange
    });
  }));
}
function Segment({
  item,
  active,
  onChange
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-pressed": active,
    onClick: () => onChange && onChange(item.id),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      height: 42,
      padding: '0 22px',
      borderRadius: 'var(--radius-pill)',
      border: 'none',
      background: active ? 'var(--accent)' : hover ? 'var(--accent-soft-hover)' : 'var(--accent-soft)',
      color: active ? 'var(--text-on-accent)' : 'var(--text-body)',
      font: 'var(--weight-bold) var(--size-body-sm)/1 var(--font-body)',
      cursor: 'pointer',
      transition: 'var(--transition-control)',
      transform: press ? 'scale(var(--press-scale))' : 'none',
      WebkitTapHighlightColor: 'transparent'
    }
  }, item.label);
}
Object.assign(__ds_scope, { SegmentedTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedTabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Bottom nav: floating white pill, active item gets a mint capsule that slides. */
function TabBar({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  const activeIndex = Math.max(0, items.findIndex(i => (i.id || i) === value));
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length || 1},1fr)`,
      padding: 7,
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-nav)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 7,
      bottom: 7,
      left: 7,
      width: `calc((100% - 14px) / ${items.length || 1})`,
      transform: `translateX(${activeIndex * 100}%)`,
      background: 'var(--accent-soft)',
      borderRadius: 'var(--radius-pill)',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  }), items.map(raw => {
    const item = typeof raw === 'string' ? {
      id: raw,
      label: raw
    } : raw;
    const active = item.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      onClick: () => onChange && onChange(item.id),
      style: {
        position: 'relative',
        zIndex: 1,
        height: 54,
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--green-900)' : 'var(--text-body)',
        font: `var(--weight-bold) var(--size-body)/1 var(--font-body)`,
        letterSpacing: 'var(--tracking-body)',
        cursor: 'pointer',
        transition: 'color var(--dur-base) var(--ease-standard)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, item.label);
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/transit/CrowdingMeter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const colors = {
  light: 'var(--crowd-light)',
  moderate: 'var(--crowd-moderate)',
  busy: 'var(--crowd-busy)'
};
const labels = {
  light: 'Light',
  moderate: 'Moderate',
  busy: 'Busy'
};
function CrowdingMeter({
  levels = ['light', 'light', 'light'],
  summary,
  showLabel = true,
  size = 'md',
  style,
  ...rest
}) {
  const w = size === 'sm' ? 24 : 30;
  const h = size === 'sm' ? 8 : 10;
  const text = summary || labels[levels[0]] || '';
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, levels.map((lvl, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    title: labels[lvl],
    style: {
      width: w,
      height: h,
      borderRadius: 'var(--radius-pill)',
      background: colors[lvl] || colors.light,
      transition: 'background-color var(--dur-slow) var(--ease-standard)'
    }
  }))), showLabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-bold) var(--size-body-sm)/1 var(--font-body)',
      color: 'var(--text-body)'
    }
  }, text) : null);
}
function CrowdingLegend({
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flexWrap: 'wrap',
      ...style
    }
  }, rest), ['light', 'moderate', 'busy'].map(lvl => /*#__PURE__*/React.createElement("span", {
    key: lvl,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 15,
      height: 15,
      borderRadius: 'var(--radius-pill)',
      background: colors[lvl]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-bold) var(--size-body-sm)/1 var(--font-body)',
      color: 'var(--text-body)'
    }
  }, labels[lvl]))));
}
Object.assign(__ds_scope, { CrowdingMeter, CrowdingLegend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transit/CrowdingMeter.jsx", error: String((e && e.message) || e) }); }

// components/transit/ArrivalRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ArrivalRow({
  destination,
  levels,
  crowdSummary,
  minutes,
  following,
  divider = true,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 0',
      borderTop: divider ? '1px solid var(--border-card)' : 'none',
      background: onClick && hover ? 'var(--sand-100)' : 'transparent',
      borderRadius: onClick ? 'var(--radius-card-inner)' : 0,
      cursor: onClick ? 'pointer' : undefined,
      transition: 'background-color var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--weight-bold) var(--size-subheading)/1.2 var(--font-body)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)'
    }
  }, destination), levels ? /*#__PURE__*/React.createElement(__ds_scope.CrowdingMeter, {
    levels: levels,
    summary: crowdSummary,
    size: "sm",
    style: {
      marginTop: 9
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "solvik-tnum",
    style: {
      font: 'var(--weight-heavy) var(--size-count)/1 var(--font-numeric)',
      color: 'var(--text-strong)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, minutes), following != null ? /*#__PURE__*/React.createElement("span", {
    className: "solvik-tnum",
    style: {
      font: 'var(--weight-regular) var(--size-body-sm)/1 var(--font-body)',
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, following, " min") : null));
}
Object.assign(__ds_scope, { ArrivalRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transit/ArrivalRow.jsx", error: String((e && e.message) || e) }); }

// components/transit/PromptCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PromptCard({
  icon = 'calendar',
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      color: 'var(--text-strong)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 28,
    strokeWidth: 1.9
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--weight-bold) var(--size-subheading)/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)'
    }
  }, title), description ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      font: 'var(--weight-regular) var(--size-body-sm)/1.3 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, description) : null), actionLabel ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "md",
    onClick: onAction,
    style: {
      flex: 'none'
    }
  }, actionLabel) : null, onDismiss ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onDismiss,
    style: {
      flex: 'none',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      padding: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 18
  })) : null));
}
Object.assign(__ds_scope, { PromptCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transit/PromptCard.jsx", error: String((e && e.message) || e) }); }

// components/transit/ServiceStatus.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  ok: {
    color: 'var(--status-ok)'
  },
  warn: {
    color: 'var(--status-warn)'
  },
  alert: {
    color: 'var(--status-alert)'
  },
  fault: {
    color: 'var(--status-fault)'
  }
};
function SectionLabel({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      font: 'var(--weight-bold) var(--size-caption)/1.2 var(--font-body)',
      letterSpacing: 'var(--tracking-label)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      ...style
    }
  }, rest), children);
}
function ServiceStatus({
  station,
  message,
  tone = 'ok',
  trailing,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.ok;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: 'var(--weight-bold) var(--size-subheading)/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)'
    }
  }, station), trailing ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none'
    }
  }, trailing) : null), message ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 9,
      font: 'var(--weight-regular) var(--size-body)/1.3 var(--font-body)',
      color: t.color
    }
  }, message) : null);
}
Object.assign(__ds_scope, { SectionLabel, ServiceStatus });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transit/ServiceStatus.jsx", error: String((e && e.message) || e) }); }

// components/transit/TripCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TripCard({
  time,
  leaveAt,
  title,
  route,
  tags = [],
  highlighted = false,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    tone: highlighted ? 'outlined' : 'plain',
    interactive: Boolean(onClick),
    onClick: onClick,
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      width: 92
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "solvik-tnum",
    style: {
      font: 'var(--type-clock)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-title)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, time), leaveAt ? /*#__PURE__*/React.createElement("div", {
    className: "solvik-tnum",
    style: {
      marginTop: 8,
      font: 'var(--weight-regular) var(--size-body-sm)/1.25 var(--font-body)',
      color: 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "Leave", /*#__PURE__*/React.createElement("br", null), leaveAt) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--weight-bold) var(--size-heading)/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)',
      textWrap: 'pretty'
    }
  }, title), route ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 7,
      font: 'var(--weight-regular) var(--size-body)/1.3 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, route) : null, tags.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      marginTop: 14
    }
  }, tags.map((raw, i) => {
    const t = typeof raw === 'string' ? {
      label: raw
    } : raw;
    return /*#__PURE__*/React.createElement(__ds_scope.Tag, {
      key: i,
      tone: t.tone || 'soft',
      icon: t.icon,
      onClick: t.onClick
    }, t.label);
  })) : null)));
}
Object.assign(__ds_scope, { TripCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/transit/TripCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/solvik-app/AppShell.jsx
try { (() => {
const {
  TabBar
} = window.SolvikDesignSystem_b39a97;
function AppShell() {
  const [tab, setTab] = React.useState('map');
  const [filter, setFilter] = React.useState('all');
  const [stepFree, setStepFree] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: 'var(--width-screen-max)',
      height: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-page)',
      overflow: 'hidden'
    }
  }, tab === 'map' ? /*#__PURE__*/React.createElement(MapScreen, {
    stepFree: stepFree,
    setStepFree: setStepFree,
    onStartTrip: () => setToast('Trip started · following NSL to Tan Tock Seng'),
    onRoutes: () => setToast('Route options are not defined in the source screens')
  }) : null, tab === 'live' ? /*#__PURE__*/React.createElement(LiveScreen, {
    filter: filter,
    setFilter: setFilter
  }) : null, tab === 'plan' ? /*#__PURE__*/React.createElement(PlanScreen, {
    connected: connected,
    onConnect: () => {
      setConnected(true);
      setToast('Calendar connected · 3 trips synced');
    },
    onSelectTrip: t => setToast(`${t.title} · leave ${t.leaveAt}`)
  }) : null, toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 92,
      zIndex: 9,
      background: 'var(--surface-dark)',
      color: 'var(--text-on-dark)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
      font: 'var(--weight-medium) var(--size-body-sm)/1.3 var(--font-body)',
      boxShadow: 'var(--shadow-raised)',
      animation: 'solvik-sheet-in var(--dur-base) var(--ease-out) both'
    }
  }, toast) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 14,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(TabBar, {
    items: [{
      id: 'map',
      label: 'Map'
    }, {
      id: 'live',
      label: 'Live'
    }, {
      id: 'plan',
      label: 'Plan'
    }],
    value: tab,
    onChange: setTab
  })));
}
Object.assign(window, {
  AppShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/solvik-app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/solvik-app/LiveScreen.jsx
try { (() => {
const {
  AppHeader,
  SegmentedTabs,
  Card,
  Badge,
  SectionLabel,
  CrowdingLegend,
  CrowdingMeter,
  ServiceStatus,
  ArrivalRow
} = window.SolvikDesignSystem_b39a97;
function LiveScreen({
  filter,
  setFilter
}) {
  const d = window.SolvikData;
  const groups = d.arrivals.filter(g => filter === 'all' || g.mode === filter);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    title: "Live arrivals",
    subtitle: `Near ${d.nearStop} · LTA DataMall`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: 'var(--pad-screen)',
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement(SegmentedTabs, {
    items: [{
      id: 'all',
      label: 'All'
    }, {
      id: 'train',
      label: 'Train'
    }, {
      id: 'bus',
      label: 'Bus'
    }],
    value: filter,
    onChange: setFilter,
    style: {
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, d.crowdingLine), /*#__PURE__*/React.createElement(CrowdingLegend, {
    style: {
      marginTop: 14
    }
  }), /*#__PURE__*/React.createElement(ServiceStatus, {
    style: {
      marginTop: 16
    },
    station: d.station.name,
    message: d.station.status,
    trailing: /*#__PURE__*/React.createElement(CrowdingMeter, {
      levels: d.station.levels,
      summary: d.station.summary
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 14
    }
  }, groups.map(g => /*#__PURE__*/React.createElement(Card, {
    key: g.id
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: g.tone
  }, g.badge), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      font: 'var(--weight-bold) var(--size-heading)/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)'
    }
  }, g.stop), /*#__PURE__*/React.createElement(SectionLabel, null, g.kind)), g.rows.map((r, i) => /*#__PURE__*/React.createElement(ArrivalRow, {
    key: r.destination,
    divider: i > 0 || true,
    destination: r.destination,
    levels: r.levels,
    crowdSummary: r.summary,
    minutes: r.minutes,
    following: r.following
  })))))));
}
Object.assign(window, {
  LiveScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/solvik-app/LiveScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/solvik-app/MapScreen.jsx
try { (() => {
const {
  MapCanvas,
  BottomSheet,
  SheetKeyframes,
  AppHeader,
  IconButton,
  TogglePill,
  Button,
  SectionLabel
} = window.SolvikDesignSystem_b39a97;
function MapScreen({
  stepFree,
  setStepFree,
  onStartTrip,
  onRoutes
}) {
  const d = window.SolvikData;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(SheetKeyframes, null), /*#__PURE__*/React.createElement(AppHeader, {
    title: d.place,
    uppercase: true,
    action: /*#__PURE__*/React.createElement(IconButton, {
      icon: "bell",
      label: "Alerts",
      badge: true
    }),
    style: {
      borderBottom: 'none',
      paddingBottom: 10
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '0 var(--pad-screen) 14px',
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-card)'
    }
  }, /*#__PURE__*/React.createElement(TogglePill, {
    icon: "lock",
    pressed: stepFree,
    onChange: setStepFree
  }, "Step-free"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onRoutes,
    style: {
      flex: 'none',
      height: 50
    }
  }, "Routes")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(MapCanvas, {
    style: {
      position: 'absolute',
      inset: 0
    },
    height: "100%",
    center: d.geo.center,
    zoom: 16,
    marker: d.geo.marker,
    route: d.geo.route
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 14,
      right: 14,
      bottom: 96
    }
  }, /*#__PURE__*/React.createElement(BottomSheet, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, d.nearStop, "\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 'none',
      width: 42,
      textAlign: 'right',
      font: 'var(--weight-bold) var(--size-body-sm)/1.15 var(--font-body)',
      color: 'var(--text-accent)'
    }
  }, "~6", /*#__PURE__*/React.createElement("br", null), "min")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
      margin: '16px 0 18px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "solvik-tnum",
    style: {
      font: 'var(--type-clock)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-title)'
    }
  }, d.next.time), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-bold) var(--size-subheading)/1.2 var(--font-display)',
      color: 'var(--text-strong)',
      letterSpacing: 'var(--tracking-heading)'
    }
  }, d.next.label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-regular) var(--size-body-sm)/1.3 var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, d.next.detail))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    iconRight: "arrow-right",
    onClick: onStartTrip
  }, "Start trip")))));
}
Object.assign(window, {
  MapScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/solvik-app/MapScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/solvik-app/PlanScreen.jsx
try { (() => {
const {
  AppHeader,
  PromptCard,
  TripCard
} = window.SolvikDesignSystem_b39a97;
function PlanScreen({
  connected,
  onConnect,
  onSelectTrip
}) {
  const d = window.SolvikData;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(AppHeader, {
    title: "Today",
    subtitle: `Fri 12 Sep · ${d.trips.length} trips`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: 'var(--pad-screen)',
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 14
    }
  }, !connected ? /*#__PURE__*/React.createElement(PromptCard, {
    icon: "calendar",
    title: "Connect Google Calendar",
    description: "Pull meetings in, get leave-by nudges",
    actionLabel: "Connect",
    onAction: onConnect
  }) : null, d.trips.map(t => /*#__PURE__*/React.createElement(TripCard, {
    key: t.id,
    time: t.time,
    leaveAt: t.leaveAt,
    title: t.title,
    route: t.route,
    tags: t.tags,
    highlighted: t.highlighted,
    onClick: () => onSelectTrip && onSelectTrip(t)
  })))));
}
Object.assign(window, {
  PlanScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/solvik-app/PlanScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/solvik-app/data.js
try { (() => {
window.SolvikData = {
  place: 'Nanyang Technological University (North Spine)',
  nearStop: 'Nanyang Technological University ( Hall of Residence 13)',
  crowdingLine: 'Crowding now · North South Line',
  station: {
    name: 'Bishan (NS17)',
    status: 'Normal service on all lines',
    levels: ['busy', 'light', 'light'],
    summary: 'Light'
  },
  arrivals: [{
    id: 'nsl',
    badge: 'NSL',
    tone: 'accent',
    stop: 'Bishan',
    kind: 'Train',
    mode: 'train',
    rows: [{
      destination: 'Jurong East',
      levels: ['busy', 'light', 'light'],
      summary: 'Light',
      minutes: 2,
      following: 8
    }, {
      destination: 'Marina South Pier',
      levels: ['busy', 'light', 'light'],
      summary: 'Light',
      minutes: 4,
      following: 11
    }]
  }, {
    id: 'bus12',
    badge: 'BUS',
    tone: 'dark',
    stop: 'Hall 12',
    kind: 'Bus · 27031',
    mode: 'bus',
    rows: [{
      destination: '179 · Boon Lay Int',
      levels: ['moderate', 'light', 'light'],
      summary: 'Moderate',
      minutes: 3,
      following: 14
    }, {
      destination: '199 · Boon Lay Int',
      levels: ['light', 'light', 'light'],
      summary: 'Light',
      minutes: 9,
      following: 21
    }]
  }, {
    id: 'bus13',
    badge: 'BUS',
    tone: 'dark',
    stop: 'Hall 13',
    kind: 'Bus · 27039',
    mode: 'bus',
    rows: [{
      destination: '291 · Tampines Int',
      levels: ['busy', 'moderate', 'light'],
      summary: 'Busy',
      minutes: 1,
      following: 12
    }]
  }],
  trips: [{
    id: 't1',
    time: '09:30',
    leaveAt: '09:04',
    title: 'Hospital follow-up',
    route: 'Bishan → Tan Tock Seng · NSL',
    tags: [{
      label: 'Step-free'
    }],
    highlighted: true
  }, {
    id: 't2',
    time: '14:00',
    leaveAt: '13:40',
    title: 'Lunch with Mum',
    route: 'Bishan → Toa Payoh · Bus 130',
    tags: [{
      label: 'Clear'
    }, {
      label: 'Calendar',
      tone: 'outline'
    }],
    highlighted: false
  }, {
    id: 't3',
    time: '18:30',
    leaveAt: '17:50',
    title: 'CCA practice',
    route: 'Bishan → Novena · NSL',
    tags: [{
      label: 'Rain forecast'
    }],
    highlighted: true
  }],
  next: {
    time: '09:30',
    label: 'Next planned trip',
    detail: 'Fastest · ~6 min',
    eta: '~6 min'
  },
  geo: {
    center: [1.34835, 103.68305],
    marker: [1.35010, 103.68280],
    route: [[1.35010, 103.68280], [1.34930, 103.68290], [1.34840, 103.68300], [1.34760, 103.68320]]
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/solvik-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardDivider = __ds_scope.CardDivider;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.TogglePill = __ds_scope.TogglePill;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.BottomSheet = __ds_scope.BottomSheet;

__ds_ns.SheetKeyframes = __ds_scope.SheetKeyframes;

__ds_ns.MapCanvas = __ds_scope.MapCanvas;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.SegmentedTabs = __ds_scope.SegmentedTabs;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.ArrivalRow = __ds_scope.ArrivalRow;

__ds_ns.CrowdingMeter = __ds_scope.CrowdingMeter;

__ds_ns.CrowdingLegend = __ds_scope.CrowdingLegend;

__ds_ns.PromptCard = __ds_scope.PromptCard;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.ServiceStatus = __ds_scope.ServiceStatus;

__ds_ns.TripCard = __ds_scope.TripCard;

})();
