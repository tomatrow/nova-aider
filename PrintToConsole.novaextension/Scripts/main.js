exports.activate = function() {
  // Register the printToConsole command
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
  
  // Register the askAI command
  nova.commands.register("askAI", (editor) => {
    if (!editor) return;
    
    // Get the selected text
    const selectedRanges = editor.selectedRanges;
    if (selectedRanges.length === 0 || (selectedRanges.length === 1 && selectedRanges[0].isEmpty)) {
      nova.workspace.showInformativeMessage("Please select text to ask about");
      return;
    }
    
    // Extract the selected text
    let selectedText = "";
    for (const range of selectedRanges) {
      selectedText += editor.getTextInRange(range);
    }
    
    // Show the sidebar
    nova.workspace.showSidebar("askSidebar");
    
    // Simulate asking AI - in a real implementation, you would send this to an AI service
    console.log("Asking AI about:", selectedText);
    nova.workspace.showInformativeMessage("Question sent to AI!");
  });
  
  // Create and register the sidebar
  class AskSidebarProvider {
    constructor() {
      this.view = null;
    }
    
    provideView(sidebar) {
      if (!this.view) {
        this.view = new AskSidebarView();
      }
      
      return this.view;
    }
  }
  
  class AskSidebarView {
    constructor() {
      this.element = document.createElement("div");
      this.element.classList.add("ask-sidebar");
      
      const heading = document.createElement("h2");
      heading.textContent = "Ask AI";
      this.element.appendChild(heading);
      
      const askButton = document.createElement("button");
      askButton.textContent = "Ask About Selection";
      askButton.classList.add("button");
      askButton.addEventListener("click", () => {
        nova.commands.invoke("askAI");
      });
      this.element.appendChild(askButton);
    }
    
    get element() {
      return this._element;
    }
    
    set element(value) {
      this._element = value;
    }
  }
  
  // Register the sidebar provider
  nova.subscriptions.add(nova.sidebar.registerProvider("askSidebar", new AskSidebarProvider()));
};
