describe('JobAlign - CV Upload and Analysis', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('should load the application', () => {
    cy.get('body').should('be.visible')
    cy.contains('JobAlign').should('exist')
  })

  it('should display the CV upload section', () => {
    cy.contains('Télécharger votre CV').should('be.visible')
    cy.get('#cv-input').should('exist')
  })

  it('should display the job offer input section', () => {
    cy.get('button[aria-label="Offre"]').click()
    cy.contains("Collez l'offre d'emploi").should('be.visible')
    cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('exist')
  })

  it('should allow file selection', () => {
    const fileName = 'sample.pdf'
    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF file content'),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true })
    cy.get('#cv-input').should('have.value', `C:\\fakepath\\${fileName}`)
  })

  it('should show error when non-PDF file is selected', () => {
    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('Not a PDF'),
      fileName: 'document.txt',
      mimeType: 'text/plain'
    }, { force: true })
    cy.contains('Le fichier doit être un PDF valide').should('be.visible')
  })

  it('should display upload button when file is selected', () => {
    cy.get('#cv-input').selectFile({
      contents: Cypress.Buffer.from('PDF file'),
      fileName: 'cv.pdf',
      mimeType: 'application/pdf'
    }, { force: true })
    cy.contains('Télécharger le CV').should('be.enabled')
  })

  it('should have analyze button', () => {
    cy.get('button[aria-label="Offre"]').click()
    cy.contains('Analyser le CV').should('exist')
  })

  it('should input and display job offer text', () => {
    const jobText = 'We are looking for a Senior Developer with 5+ years of experience in React'
    cy.get('button[aria-label="Offre"]').click()
    cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type(jobText)
    cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', jobText)
  })

  // The UI does not include explicit "Effacer" buttons; skip this check.

  it('should have proper card layout structure', () => {
    cy.get('[class*="card"]').should('have.length.greaterThan', 0)
  })

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x')
    cy.contains('Télécharger votre CV').should('be.visible')
    cy.get('button[aria-label="Offre"]').click()
    cy.contains("Collez l'offre d'emploi").should('be.visible')
  })

  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2')
    cy.contains('Télécharger votre CV').should('be.visible')
    cy.get('button[aria-label="Offre"]').click()
    cy.contains("Collez l'offre d'emploi").should('be.visible')
  })
})
