import React from "react";
import { IRuntimeFormState, IRuntimeFieldState } from "../types/IRuntimeFieldState";

export interface IFormDevToolsProps {
  configName: string;
  formState?: IRuntimeFormState;
  formValues?: Record<string, unknown>;
  formErrors?: Record<string, unknown>;
  dirtyFields?: Record<string, boolean>;
  enabled?: boolean;
}

export const FormDevTools: React.FC<IFormDevToolsProps> = (props) => {
  const { configName, formState, formValues, formErrors, dirtyFields, enabled = true } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"rules" | "values" | "errors" | "graph">("rules");

  if (!enabled) return null;

  const fieldStates = formState?.fieldStates ?? {};
  const fieldNames = Object.keys(fieldStates);

  const dependencyGraph = React.useMemo(() => {
    const lines: string[] = [];
    for (const [name, state] of Object.entries(fieldStates)) {
      if (state.dependentFields?.length) {
        lines.push(`${name} -> ${state.dependentFields.join(", ")}`);
      }
      if (state.dependsOnFields?.length) {
        lines.push(`${name} (depends on) ${state.dependsOnFields.join(", ")}`);
      }
    }
    return lines;
  }, [fieldStates]);

  const containerStyle: React.CSSProperties = {
    position: "fixed", bottom: 0, right: 0,
    width: isOpen ? "400px" : "auto", maxHeight: isOpen ? "50vh" : "auto",
    background: "#1e1e1e", color: "#d4d4d4", fontFamily: "monospace", fontSize: "12px",
    zIndex: 9999, borderTopLeftRadius: "8px", overflow: "hidden", boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 8px", cursor: "pointer",
    background: active ? "#333" : "transparent", color: active ? "#fff" : "#888",
    border: "none", borderBottom: active ? "2px solid #007acc" : "2px solid transparent",
    fontFamily: "monospace", fontSize: "11px",
  });

  return (
    <div style={containerStyle} data-testid="form-devtools">
      <div style={{ padding: "4px 8px", cursor: "pointer", background: "#333", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setIsOpen(!isOpen)}>
        <span style={{ color: "#007acc", fontWeight: "bold" }}>DevTools: {configName}</span>
        <span>{isOpen ? "\u25BC" : "\u25B2"}</span>
      </div>
      {isOpen && (
        <>
          <div style={{ display: "flex", borderBottom: "1px solid #333" }}>
            <button style={tabStyle(activeTab === "rules")} onClick={() => setActiveTab("rules")}>Rules ({fieldNames.length})</button>
            <button style={tabStyle(activeTab === "values")} onClick={() => setActiveTab("values")}>Values</button>
            <button style={tabStyle(activeTab === "errors")} onClick={() => setActiveTab("errors")}>Errors</button>
            <button style={tabStyle(activeTab === "graph")} onClick={() => setActiveTab("graph")}>Graph</button>
          </div>
          <div style={{ overflow: "auto", maxHeight: "calc(50vh - 60px)", padding: "8px" }}>
            {activeTab === "rules" && fieldNames.map(name => {
              const state = fieldStates[name];
              return (
                <div key={name} style={{ marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "4px" }}>
                  <div style={{ color: "#4ec9b0" }}>{name}</div>
                  <div>type: {state.type ?? "\u2014"} | required: {String(state.required ?? false)} | hidden: {String(state.hidden ?? false)} | readOnly: {String(state.readOnly ?? false)}</div>
                  {state.validate?.length ? <div>validate: {state.validate.map(v => v.name).join(", ")}</div> : null}
                  {state.computedValue ? <div>computedValue: {state.computedValue}</div> : null}
                  {state.activeRuleIds?.length ? <div>activeRules: {state.activeRuleIds.join(", ")}</div> : null}
                </div>
              );
            })}
            {activeTab === "values" && <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(formValues, null, 2)}</pre>}
            {activeTab === "errors" && (
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: formErrors && Object.keys(formErrors).length > 0 ? "#f44747" : "#4ec9b0" }}>
                {formErrors && Object.keys(formErrors).length > 0 ? JSON.stringify(formErrors, null, 2) : "No errors"}
              </pre>
            )}
            {activeTab === "graph" && (dependencyGraph.length > 0
              ? dependencyGraph.map((line, i) => <div key={i} style={{ color: "#ce9178" }}>{line}</div>)
              : <div>No dependencies defined</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

