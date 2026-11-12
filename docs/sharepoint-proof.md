# Find the link VowPilot left open

In a dedicated workshop SharePoint library, create a fictional file named **Internal guest brief**. Create the lab's broad sharing link to that file, using a link type permitted in the lab tenant. Give the Privacy participant access to inspect the file's **Manage access → Links** panel and copy the existing link. Supply the library address separately, not the answer link. Rehearse with the actual workshop account because visibility can depend on its permissions.

Set the full link in Cloudflare Workers as the `SHAREPOINT_LAB_LINK` secret. Only one link is expected across live rooms. Until configured, the task does not appear in participant rooms. Admin rehearsal always shows a sample link and needs no SharePoint setup.

Players open **Privacy → Planner → Find the link VowPilot left open** and paste the link from Manage access. A correct match awards one milestone. Keep the link in place during the workshop so the next team can find it. Blissify never opens the URL or changes SharePoint. The submitted link is checked server-side and is not stored in room progress.
