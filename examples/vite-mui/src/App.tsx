import { useState, useEffect } from "react";
import { Container, Typography, Tabs, Tab, Box, Paper } from "@mui/material";
import { UseInjectedHookFieldContext, HookInlineForm } from "@bghcore/dynamic-forms-core";
import { createMuiFieldRegistry } from "@bghcore/dynamic-forms-mui";
import { basicFormConfig, basicDefaults } from "./configs/basicForm";
import { businessRulesConfig, businessRulesDefaults } from "./configs/businessRulesForm";
import { zodExampleConfig, zodExampleDefaults } from "./configs/zodForm";

function FieldRegistrar({ children }: { children: React.ReactNode }) {
  const { setInjectedFields } = UseInjectedHookFieldContext();
  useEffect(() => {
    setInjectedFields(createMuiFieldRegistry());
  }, [setInjectedFields]);
  return <>{children}</>;
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dynamic React Business Forms
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configuration-driven forms with a declarative business rules engine.
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Basic" />
        <Tab label="Business Rules" />
        <Tab label="Zod Schema" />
      </Tabs>
      <FieldRegistrar>
        <TabPanel value={tab} index={0}>
          <Paper sx={{ p: 3 }}>
            <HookInlineForm
              configName="basicForm"
              programName="example"
              fieldConfigs={basicFormConfig}
              defaultValues={basicDefaults}
              isManualSave={true}
              saveData={async (data) => { alert(JSON.stringify(data, null, 2)); return data; }}
            />
          </Paper>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Change &quot;Issue Type&quot; to see fields show/hide based on business rules.
            </Typography>
            <HookInlineForm
              configName="businessRulesForm"
              programName="example"
              fieldConfigs={businessRulesConfig}
              defaultValues={businessRulesDefaults}
              isManualSave={true}
              saveData={async (data) => { alert(JSON.stringify(data, null, 2)); return data; }}
            />
          </Paper>
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This form was generated from a Zod schema using zodSchemaToFieldConfig().
            </Typography>
            <HookInlineForm
              configName="zodForm"
              programName="example"
              fieldConfigs={zodExampleConfig}
              defaultValues={zodExampleDefaults}
              isManualSave={true}
              saveData={async (data) => { alert(JSON.stringify(data, null, 2)); return data; }}
            />
          </Paper>
        </TabPanel>
      </FieldRegistrar>
    </Container>
  );
}
