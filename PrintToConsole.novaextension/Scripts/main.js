exports.activate = function() {
  // Register the command
  nova.commands.register("printToConsole", (editor) => {
    if (!editor) return;
    
    // Get the selected text
    const selectedRanges = editor.selectedRanges;
    if (selectedRanges.length === 0 || (selectedRanges.length === 1 && selectedRanges[0].isEmpty)) {
      console.log("No text selected");
      return;
    }
    
    // Extract the selected text
    let selectedText = "";
    for (const range of selectedRanges) {
      selectedText += editor.getTextInRange(range);
    }
    
    // Print to the console
    console.log(selectedText);
  });
};
