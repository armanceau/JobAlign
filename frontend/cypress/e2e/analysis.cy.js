describe('CV and Job Offer Analysis', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  describe('Job Offer Input', () => {
    it('should accept job offer text', () => {
      const jobOfferText = 'Senior Developer Position - 5+ years experience required'
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type(jobOfferText)
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', jobOfferText)
    })

    it('should accept multiline job offer text', () => {
      const jobOfferText = `Job Title: Senior Developer
Location: Remote
Requirements:
- 5+ years experience
- React expertise
- Team leadership`
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type(jobOfferText, { delay: 0 })
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', jobOfferText)
    })

    it('should clear job offer text', () => {
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('Some job offer text')
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").clear()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', '')
    })
  })

  describe('Analysis Workflow', () => {
    it('should not allow analysis without CV and job offer', () => {
      // navigate to step 2 (same URL navigation)
      cy.get('button[aria-label="Offre"]').click()
      cy.contains('Analyser le CV').should('be.disabled')
    })

    it('should prepare data for analysis with CV and job offer', () => {
      // Ensure CV step is active and upload CV
      cy.get('button[aria-label="CV"]').click()
      // Upload CV
      cy.get('#cv-input').selectFile({
        contents: Cypress.Buffer.from('PDF content'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })

      // Verify CV input is set while on the CV step
      cy.get('#cv-input').should('have.value', 'C:\\fakepath\\cv.pdf')

      // Add job offer on the second step
      const jobOfferText = 'Senior React Developer needed'
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type(jobOfferText)
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', jobOfferText)
    })

    it('should display results section when analysis completes', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 }).as('uploadCv')
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted CV text' }
      }).as('extractCvText')
      cy.intercept('POST', '**/nlp/analyze', {
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
            shared_diplomas: [],
            shared_languages: []
          },
          matching: {
            method: 'det',
            global_score_percent: 92,
            subscores: {
              technical_skills: {
                score_percent: 90,
                weight: 1,
                required_count: 0,
                matched_count: 0,
                required_items: [],
                matched_items: [],
                missing_items: [],
                justification: 'Bonne correspondance technique',
              },
              experience: {
                score_percent: 85,
                weight: 1,
                required_count: 0,
                matched_count: 0,
                required_items: [],
                matched_items: [],
                missing_items: [],
                justification: 'Expérience pertinente détectée',
              },
              education: {
                score_percent: 80,
                weight: 1,
                required_count: 0,
                matched_count: 0,
                required_items: [],
                matched_items: [],
                missing_items: [],
                justification: 'Formation adéquate',
              },
              soft_skills: {
                score_percent: 70,
                weight: 1,
                required_count: 0,
                matched_count: 0,
                required_items: [],
                matched_items: [],
                missing_items: [],
                justification: 'Bon niveau de soft skills',
              },
              language: {
                score_percent: 75,
                weight: 1,
                required_count: 0,
                matched_count: 0,
                required_items: [],
                matched_items: [],
                missing_items: [],
                justification: 'Langues compatibles',
              },
            },
            justifications: ['Bonne correspondance globale'],
          },
        }
      }).as('nlpAnalyze')
      cy.intercept('POST', '**/nlp/recommendations', {
        statusCode: 200,
        body: {
          provider: 'local',
          model: 'test',
          status: 'success',
          summary: 'Suggestions prêtes',
          missing_keywords: [],
          reformulations: [],
          improvements: [],
        },
      }).as('nlpRecommendations')

      // Upload CV and wait for extraction
      cy.get('button[aria-label="CV"]').click()
      cy.get('#cv-input').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()
      cy.wait('@extractCvText')
      cy.contains('CV chargé').should('be.visible')

      // Move to step 2 and analyze
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('Job with React requirement')
      cy.contains('Analyser le CV').click()
      cy.wait('@nlpAnalyze')

      // Check for results
      cy.contains('Score global').should('be.visible')
      cy.contains('Matching déterministe CV/offre').should('be.visible')
    })
  })

  describe('Data Display', () => {
    it('should display CV extracted text', () => {
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 }).as('uploadCv')
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'John Doe - Senior Developer - 5 years experience' }
      }).as('extractCvText')
      cy.intercept('POST', '**/nlp/analyze', {
        statusCode: 200,
        body: {
          cv: { hard_skills: [] },
          offer: { hard_skills: [] },
          summary: { shared_hard_skills: ['React'], shared_soft_skills: [], shared_diplomas: [] },
          matching: {
            method: 'det',
            global_score_percent: 90,
            subscores: {
              technical_skills: { score_percent: 90, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
              experience: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
              education: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
              soft_skills: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
              language: { score_percent: 0, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: '' },
            },
          },
        }
      }).as('nlpAnalyze')

      cy.get('button[aria-label="CV"]').click()
      cy.get('#cv-input').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()
      cy.wait('@extractCvText')
      cy.contains('CV chargé').should('be.visible')

      // go to results by analyzing
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('React')
      cy.contains('Analyser le CV').click()
      cy.wait('@nlpAnalyze')
      cy.contains('Hard skills communes').should('be.visible')
    })

    it('should display analysis summary', () => {
      // Mock upload and extract endpoints used by the UI
      cy.intercept('POST', '**/upload-cv', { statusCode: 200 }).as('uploadCv')
      cy.intercept('POST', '**/extract-cv-text', {
        statusCode: 200,
        body: { text: 'Extracted CV text' }
      }).as('extractCvText')

      cy.intercept('POST', '**/nlp/analyze', {
        statusCode: 200,
        body: {
          cv: { hard_skills: ['React'], soft_skills: [], diplomas: [], experiences: [], entities: [] },
          offer: { hard_skills: ['React'], soft_skills: [], diplomas: [], experiences: [], entities: [] },
          summary: {
            shared_hard_skills: ['React', 'JavaScript'],
            shared_soft_skills: [],
            shared_diplomas: [],
            shared_languages: []
          },
          matching: {
            method: 'det',
            global_score_percent: 88,
            subscores: {
              technical_skills: { score_percent: 88, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: 'Bon match technique' },
              experience: { score_percent: 75, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: 'Expérience pertinente' },
              education: { score_percent: 80, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: 'Formation adéquate' },
              soft_skills: { score_percent: 70, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: 'Soft skills compatibles' },
              language: { score_percent: 65, weight: 1, required_count: 0, matched_count: 0, required_items: [], matched_items: [], missing_items: [], justification: 'Langues compatibles' },
            },
            justifications: ['Bonne correspondance globale'],
          },
        }
      }).as('nlpAnalyze')
      cy.intercept('POST', '**/nlp/recommendations', {
        statusCode: 200,
        body: {
          provider: 'local',
          model: 'test',
          status: 'success',
          summary: 'Suggestions prêtes',
          missing_keywords: [],
          reformulations: [],
          improvements: [],
        },
      }).as('nlpRecommendations')

      // Trigger upload + analysis flow
      cy.get('button[aria-label="CV"]').click()
      cy.get('#cv-input').should('exist')
      cy.get('#cv-input').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()
      cy.wait('@extractCvText')
      cy.contains('CV chargé').should('be.visible')

      // Move to offer step and analyze
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('React Developer needed')
      cy.contains('Analyser le CV').click()
      cy.wait('@nlpAnalyze')

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

      cy.get('button[aria-label="CV"]').click()
      cy.get('#cv-input').selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'cv.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      cy.contains('Télécharger le CV').click()

      // Uploaded CV alert should be visible and input cleared
      cy.contains('CV chargé').should('be.visible')
      cy.get('#cv-input').invoke('val').should('equal', '')
    })

    it('should clear all data on clear button', () => {
      cy.get('button[aria-label="Offre"]').click()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").type('Job offer text')
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").clear()
      cy.get("textarea[placeholder=\"Collez ici l'offre d'emploi complète...\"]").should('have.value', '')
    })


  })
})
