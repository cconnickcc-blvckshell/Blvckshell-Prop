/**
 * Utility to parse markdown checklist files into ChecklistTemplate items
 */

export interface ChecklistItem {
  itemId: string;
  label: string;
  required: boolean;
  photoRequired?: boolean;
  photoPointLabel?: string;
}

export interface ParsedChecklist {
  checklistId: string;
  name: string;
  items: ChecklistItem[];
}

/**
 * Parse a markdown checklist file into structured items
 * Expects format:
 * | Item ID | Task | Required | Photo Point | Fail Condition |
 */
export function parseChecklistMarkdown(content: string, checklistId: string): ParsedChecklist | null {
  const lines = content.split("\n");
  
  // Find the checklist items table (starts with "## Checklist Items")
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("## Checklist Items")) {
      tableStartIndex = i;
      break;
    }
  }
  
  if (tableStartIndex === -1) {
    return null;
  }
  
  // Extract title from first line (should be "# Checklist Name")
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1].trim() : checklistId;
  
  // Find the table header and rows
  const items: ChecklistItem[] = [];
  let inTable = false;
  
  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Detect table start (header row with | Item ID | Task | ...)
    if (line.startsWith("|") && line.includes("Item ID") && line.includes("Task")) {
      inTable = true;
      continue;
    }
    
    // Detect table end (horizontal rule or next section)
    if (inTable && (line.startsWith("---") || line.startsWith("##"))) {
      break;
    }
    
    // Parse table rows
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").map(c => c.trim()).filter(c => c);
      
      // Expected format: | Item ID | Task | Required | Photo Point | Fail Condition |
      // Skip header row (contains "Item ID")
      if (cells[0] === "Item ID" || cells[0] === "**Item ID**") {
        continue;
      }
      
      if (cells.length >= 4) {
        const itemId = cells[0].replace(/\*\*/g, "").trim(); // Remove markdown bold
        const task = cells[1].trim();
        const requiredText = cells[2].trim().toLowerCase();
        const required = requiredText === "yes" || requiredText === "true" || requiredText === "required";
        const photoPoint = cells[3]?.trim() ?? "";
        const photoRequired = photoPoint.length > 0 && photoPoint.toLowerCase() !== "n/a";
        const photoPointLabel = photoRequired ? photoPoint : undefined;
        
        if (itemId && task) {
          items.push({
            itemId,
            label: task,
            required,
            photoRequired,
            photoPointLabel,
          });
        }
      } else if (cells.length >= 3) {
        const itemId = cells[0].replace(/\*\*/g, "").trim();
        const task = cells[1].trim();
        const requiredText = cells[2].trim().toLowerCase();
        const required = requiredText === "yes" || requiredText === "true" || requiredText === "required";
        if (itemId && task) {
          items.push({ itemId, label: task, required });
        }
      }
    }
  }
  
  if (items.length === 0) {
    return null;
  }
  
  return {
    checklistId,
    name,
    items,
  };
}

/**
 * Get all available checklist templates from markdown files
 */
export function getAvailableChecklistTemplates(): Array<{ id: string; name: string }> {
  // Map of checklist IDs to names
  const templates = [
    { id: "CL_01", name: "Lobby Checklist" },
    { id: "CL_02", name: "Hallway Checklist" },
    { id: "CL_03", name: "Stairwell Checklist" },
    { id: "CL_04", name: "Elevator Checklist" },
    { id: "CL_05", name: "Garbage Room Checklist" },
    { id: "CL_06", name: "Glass Doors Spot Checklist" },
    { id: "CL_07", name: "Washroom Common Area Checklist" },
    { id: "CL_08", name: "Seasonal Deep Clean Checklist" },
  ];
  
  return templates;
}
