import { BroadcastEmailTemplateEditorPage } from "@/components/dashboard/communications/BroadcastEmailTemplateEditorPage";
import { loadBroadcastTemplateEditorAccess } from "@/lib/broadcast/template-editor-access";
import { Box, Typography } from "@mui/material";

export default async function NewEmailTemplatePage() {
  const { canRead, canManage } = await loadBroadcastTemplateEditorAccess();

  if (!canRead) {
    return (
      <Box>
        <Typography color="error">You do not have access to broadcast templates.</Typography>
      </Box>
    );
  }

  return <BroadcastEmailTemplateEditorPage canManage={canManage} />;
}
