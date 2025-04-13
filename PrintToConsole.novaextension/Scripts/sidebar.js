// This file is just needed to set up the sidebar view structure
class AskSidebarView {
  constructor() {
    // Create the main sidebar element
    const sidebarElement = document.createElement("div");
    sidebarElement.classList.add("ask-sidebar");
    
    this.element = sidebarElement;
  }
}

module.exports = AskSidebarView;
