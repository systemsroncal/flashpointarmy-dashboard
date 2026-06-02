import { BroadcastSmsTemplateEditorPage } from "@/components/dashboard/communications/BroadcastSmsTemplateEditorPage";
import { loadBroadcastTemplateEditorAccess } from "@/lib/broadcast/template-editor-access";
import { Box, Typography } from "@mui/material";

type Props = { params: Promise<{ id: string }> };

export default async function EditSmsTemplatePage({ params }: Props) {
  const { id } = await params;
  const { canRead, canManage } = await loadBroadcastTemplateEditorAccess();

  if (!canRead) {
    return (
      <Box>
        <Typography color="error">You do not have access to broadcast templates.</Typography>
      </Box>
    );
  }

  return <BroadcastSmsTemplateEditorPage templateId={id} canManage={canManage} />;
}
