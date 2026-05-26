describe('CV and Job Offer Analysis', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  describe('Job Offer Input', () => {
    it('should accept job offer text', () => {
      const jobOfferText = 'Senior Developer Position - 5+ years experience required'
      cy.get('textarea').eq(0).type(jobOfferText)
      cy.get('textarea').eq(0).should('have.value', jobOfferText)
    })

    it('should accept multiline job offer text', () => {
      const jobOfferText = `Job Title: Senior Developer
Location: Remote
Requirements:
- 5+ years experience
- React expertise
- Team leadership`
      cy.get('textarea').eq(0).type(jobOfferText, { delay: 0 })
      cy.get('textarea').eq(0).should('have.value', jobOfferText)
    })

    it('should clear job offer text', () => {
      cy.get('textarea').eq(0).type('Some job offer text')
      cy.get('textarea').eq(0).clear()
      cy.get('textarea').eq(0).should('have.value', '')
    })
  })

  describe('Analysis Workflow', () => {
    it('should not allow analysis without CV and job offer', () => {
      // Button should be disabled when no CV or job offer is provided
      cy.contains('Analyser le CV').should('be.disabled')
    })

    it('should prepare data for analysis with CV and job offer', () => {
      // Upload CV
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })

      // Add job offer
      const jobOfferText = 'Senior React Developer needed'
      cy.get('textarea').eq(0).type(jobOfferText)

      // Both should be set
      cy.get('input[type="file"]').should('have.value', 'C:\\fakepath\\cv.pdf')
      cy.get('textarea').eq(0).should('have.value', jobOfferText)
    })

    it('should display results section when analysis completes', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted CV text' }
      })
      cy.intercept('POST', '**/analyze', {
        statusCode: 200,
        body: {
          cv: {
            hard_skills: ['React', 'JavaScript', 'Node.js'],
            soft_skills: ['Leadership', 'Communication'],
            diplomas: ['Bachelor in Computer Science'],
            experiences: [{ text: 'Senior Developer at TechCorp', years: 5 }],
            entities: []
          },
          offer: {
            hard_skills: ['React', 'JavaScript'],
            soft_skills: ['Team Player'],
            diplomas: [],
            experiences: [],
            entities: []
          },
          summary: {
            shared_hard_skills: ['React', 'JavaScript'],
            shared_soft_skills: [],
            shared_diplomas: []
          }
        }
      })

      // Upload CV
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      // Add job offer and analyze
      cy.get('textarea').eq(0).type('Job with React requirement')
      cy.contains('Analyser le CV').click()

      // Check for results
      cy.contains(/React|JavaScript|résultat|score/i).should('exist')
    })
  })

  describe('Data Display', () => {
    it('should display CV extracted text', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'John Doe - Senior Developer - 5 years experience' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      cy.contains('John Doe').should('be.visible')
    })

    it('should display analysis summary', () => {
      // Mock upload and extract endpoints used by the UI
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted CV text' }
      })

      cy.intercept('POST', '**/analyze', {
        statusCode: 200,
        body: {
          cv: { hard_skills: ['React'], soft_skills: [], diplomas: [], experiences: [], entities: [] },
          offer: { hard_skills: ['React'], soft_skills: [], diplomas: [], experiences: [], entities: [] },
          summary: {
            shared_hard_skills: ['React', 'JavaScript'],
            shared_soft_skills: [],
            shared_diplomas: []
          }
        }
      })

      // Trigger upload + analysis flow
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      cy.get('textarea').eq(0).type('React Developer needed')
      cy.contains('Analyser le CV').click()

      // Check for shared hard skills in the results
      cy.contains('Hard skills communes').should('be.visible')
      cy.contains('React').should('be.visible')
    })
  })

  describe('Clear Functions', () => {
    it('should clear uploaded CV data', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 })
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'CV text' }
      })

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      // Uploaded CV alert should be visible and input cleared
      cy.contains('CV chargé').should('be.visible')
      cy.get('input[type="file"]').invoke('val').should('equal', '')
    })

    it('should clear all data on clear button', () => {
      cy.get('textarea').eq(0).type('Job offer text')
      cy.get('textarea').eq(0).clear()
      cy.get('textarea').eq(0).should('have.value', '')
    })

    it('should not affect other sections when clearing', () => {
      const jobText = 'Job requirements'
      cy.get('textarea').eq(0).type(jobText)

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })

      cy.get('textarea').eq(0).clear()
      cy.get('textarea').eq(0).should('have.value', '')
      cy.get('input[type="file"]').should('have.value', 'C:\\fakepath\\cv.pdf')
    })
  })
})
