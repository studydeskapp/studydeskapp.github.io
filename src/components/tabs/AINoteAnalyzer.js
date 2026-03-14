import React, { useState } from 'react';
import { callGemini, uploadFileToGemini, callGeminiWithFile, deleteGeminiFile } from '../../utils/gemini';
import { extractTextFromFile, validateFile, createFileAttachment } from '../../utils/fileUtils';

function AINoteAnalyzer({ notes, assignments, darkMode }) {
  const [analysisMode, setAnalysisMode] = useState('summary'); // 'summary', 'insights', 'questions', 'connections'
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedGeminiFiles, setUploadedGeminiFiles] = useState([]); // Store Gemini file references
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [studyPlan, setStudyPlan] = useState('');
  
  // Interactive question state
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [userTextAnswers, setUserTextAnswers] = useState({});

  const handleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const fileAttachments = [];
    const geminiFiles = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`File "${file.name}" is invalid: ${validation.error}`);
        continue;
      }
      
      try {
        const attachment = createFileAttachment(file);
        fileAttachments.push(attachment);
        validFiles.push(file);

        // Upload to Gemini Files API for PDFs and images
        if (file.type.includes('pdf') || file.type.startsWith('image/')) {
          try {
            console.log(`Uploading ${file.name} to Gemini...`);
            const geminiFile = await uploadFileToGemini(file);
            console.log(`Successfully uploaded ${file.name} to Gemini:`, geminiFile);
            geminiFiles.push({
              ...attachment,
              geminiFile: geminiFile
            });
          } catch (error) {
            console.error(`Failed to upload ${file.name} to Gemini:`, error);
            alert(`Failed to upload ${file.name} to Gemini: ${error.message}. Will use filename analysis instead.`);
            // Still add the file even if Gemini upload fails
            geminiFiles.push(attachment);
          }
        } else {
          geminiFiles.push(attachment);
        }
      } catch (error) {
        alert(`Failed to process file "${file.name}": ${error.message}`);
      }
    }

    if (fileAttachments.length > 0) {
      setUploadedFiles(prev => [...prev, ...fileAttachments]);
      setUploadedGeminiFiles(prev => [...prev, ...geminiFiles]);
      
      // Log the final state
      console.log('Uploaded files:', fileAttachments.length);
      console.log('Gemini files:', geminiFiles.filter(f => f.geminiFile).length);
    }
  };

  const removeUploadedFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    
    // Also remove from Gemini files and cleanup
    const geminiFileToRemove = uploadedGeminiFiles.find(file => file.id === fileId);
    if (geminiFileToRemove?.geminiFile) {
      deleteGeminiFile(geminiFileToRemove.geminiFile);
    }
    setUploadedGeminiFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const extractContentFromUploadedFiles = async () => {
    const content = [];
    
    for (const file of uploadedFiles) {
      try {
        let textContent = '';
        
        if (file.type.startsWith('image/')) {
          textContent = `[Image: ${file.name} - Visual content that would need OCR analysis. Based on filename, this appears to be related to visual learning materials.]`;
        } else if (file.type === 'text/plain') {
          // For text files, we can read the content directly
          const reader = new FileReader();
          textContent = await new Promise((resolve, reject) => {
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
          });
        } else if (file.type.includes('pdf')) {
          // Extract meaningful info from filename for PDF analysis
          const filename = file.name.toLowerCase();
          let subjectGuess = '';
          let topicGuess = '';
          
          if (filename.includes('chemistry') || filename.includes('chem')) {
            subjectGuess = 'Chemistry';
            if (filename.includes('foundations')) topicGuess = 'Foundational chemistry concepts';
            else if (filename.includes('organic')) topicGuess = 'Organic chemistry';
            else if (filename.includes('inorganic')) topicGuess = 'Inorganic chemistry';
            else if (filename.includes('physical')) topicGuess = 'Physical chemistry';
            else topicGuess = 'General chemistry topics';
          } else if (filename.includes('physics')) {
            subjectGuess = 'Physics';
            topicGuess = 'Physics concepts and problems';
          } else if (filename.includes('biology') || filename.includes('bio')) {
            subjectGuess = 'Biology';
            topicGuess = 'Biological concepts and processes';
          } else if (filename.includes('math') || filename.includes('calculus') || filename.includes('algebra')) {
            subjectGuess = 'Mathematics';
            topicGuess = 'Mathematical concepts and problems';
          } else if (filename.includes('history')) {
            subjectGuess = 'History';
            topicGuess = 'Historical events and periods';
          } else if (filename.includes('english') || filename.includes('literature')) {
            subjectGuess = 'English/Literature';
            topicGuess = 'Literary analysis and writing';
          }
          
          textContent = `[PDF Document: ${file.name}
Subject: ${subjectGuess || 'Unknown subject'}
Topic: ${topicGuess || 'General study material'}
File size: ${Math.round(file.size / 1024)} KB
Note: This appears to be a ${subjectGuess ? subjectGuess + ' ' : ''}document. For detailed content analysis, the PDF text would need to be extracted using a PDF parsing library.]`;
        } else if (file.type.includes('word') || file.type.includes('document')) {
          textContent = `[Word Document: ${file.name} - Content extraction would require DOCX parsing library. File size: ${Math.round(file.size / 1024)} KB]`;
        } else {
          textContent = `[File: ${file.name} - Content type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB]`;
        }
        
        content.push(`--- Content from ${file.name} ---\n${textContent}`);
      } catch (error) {
        console.warn(`Failed to extract text from ${file.name}:`, error);
        content.push(`--- Content from ${file.name} ---\n[File content extraction failed]`);
      }
    }
    
    return content.join('\n\n');
  };

  const getSelectedNotesContent = () => {
    return notes.filter(note => selectedNotes.includes(note.id));
  };

  // Interactive question handlers
  const handleMultipleChoiceAnswer = (questionIndex, selectedOption) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: selectedOption }));
    setShowResults(prev => ({ ...prev, [questionIndex]: true }));
  };

  const handleTextAnswer = (questionIndex, answer) => {
    setUserTextAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const checkTextAnswerWithAI = async (questionIndex, question) => {
    const userAnswer = userTextAnswers[questionIndex] || '';
    if (!userAnswer.trim()) {
      alert('Please provide an answer first');
      return;
    }

    setCheckingAnswer(true);
    try {
      const prompt = `You are evaluating a student's answer to a question.

Question: ${question.text}
Expected Answer: ${question.answer}
Student's Answer: ${userAnswer}

Evaluate if the student's answer is correct. Respond in this exact format:
RESULT: [CORRECT or INCORRECT]
FEEDBACK: [Brief 1-2 sentence explanation. If incorrect, explain why and what was missing. If correct, acknowledge what they got right.]`;

      const response = await callGemini(prompt, "You are a helpful study assistant evaluating student answers. Be encouraging but accurate.");
      
      const resultMatch = response.match(/RESULT:\s*(CORRECT|INCORRECT)/i);
      const feedbackMatch = response.match(/FEEDBACK:\s*(.+)/is);
      
      const isCorrect = resultMatch && resultMatch[1].toUpperCase() === 'CORRECT';
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : response;
      
      setShowResults(prev => ({ 
        ...prev, 
        [questionIndex]: { 
          shown: true, 
          isCorrect, 
          feedback 
        } 
      }));
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Failed to check answer. Please try again.');
    } finally {
      setCheckingAnswer(false);
    }
  };

  const getSystemPrompt = (mode) => {
    switch (mode) {
      case 'summary':
        return "You are a helpful AI study assistant. Provide comprehensive summaries of study materials.";
      case 'insights':
        return "You are a helpful AI study assistant. Provide actionable learning insights and study recommendations.";
      case 'questions':
        return "You are a helpful AI study assistant. Generate practice questions to test understanding of study materials.";
      case 'connections':
        return "You are a helpful AI study assistant. Identify connections between different study topics and materials.";
      case 'studyPlan':
        return "You are a helpful AI study assistant. Create personalized study plans for students.";
      default:
        return "You are a helpful study assistant for high school students. Be concise and friendly.";
    }
  };

  const createPromptForFiles = async (mode, assignments) => {
    const upcomingAssignments = assignments.filter(a => new Date(a.dueDate) > new Date())
      .map(a => `${a.title} (${a.subject}) - Due: ${a.dueDate}`).join('\n');

    switch (mode) {
      case 'summary':
        return `Please provide a comprehensive summary of this document. Focus on:
1. Key concepts and main ideas
2. Important definitions and formulas
3. Overall themes and patterns
4. Study recommendations

${upcomingAssignments ? `Upcoming Assignments:\n${upcomingAssignments}\n\nConsider how this material relates to upcoming assignments.` : ''}

Provide the summary in a clear, structured format with headings and bullet points.`;

      case 'insights':
        return `Analyze this document and provide actionable insights for learning.

${upcomingAssignments ? `Upcoming Assignments:\n${upcomingAssignments}` : ''}

Please provide:
1. Learning gaps or areas that need more attention
2. Strengths and well-understood topics
3. Study priorities based on this content
4. Recommended study methods for these topics
5. Potential connections between different subjects

Format your response with clear sections and actionable advice.`;

      case 'questions':
        return `Based on this document, generate practice questions to test understanding. 

IMPORTANT: Create actual QUESTIONS that students can answer, not definitions or explanations. Each question should ask the student to DO something or demonstrate knowledge.

Generate exactly these types of questions:

MULTIPLE CHOICE (5 questions):
Format each as:
1. [Question text asking student to choose answer]
   A) [Option 1 text]
   B) [Option 2 text] 
   C) [Option 3 text]
   D) [Option 4 text]
   Correct Answer: [letter A, B, C, or D]
   Explanation: [brief explanation]

SHORT ANSWER (3 questions):
Format each as:
6. [Question that requires 1-2 sentence answer]
   Answer: [expected answer]
   
ESSAY/DISCUSSION (2 questions):
Format each as:
9. [Question requiring detailed explanation or comparison]
   Answer: [key points expected]

PROBLEM-SOLVING (2 questions):
Format each as:
11. [Mathematical problem to solve]
   Answer: [solution with steps]

CRITICAL: For multiple choice questions, you MUST provide 4 distinct options labeled A), B), C), D) and clearly mark which one is correct. Do NOT use bullet points or numbers for options.

Examples of GOOD multiple choice questions:
1. Which of the following is the correct negation of the statement "For all x, P(x)"?
   A) For all x, not P(x)
   B) There exists x such that not P(x)
   C) For all x, P(x)
   D) There exists x such that P(x)
   Correct Answer: B
   Explanation: The negation of a universal quantifier becomes an existential quantifier.

DO NOT include definitions, theorems, or proof steps as questions.`;

      case 'connections':
        return `Analyze this document and identify connections to other topics.

${assignments.map(a => `${a.title} (${a.subject})`).join('\n') ? `Current Assignments:\n${assignments.map(a => `${a.title} (${a.subject})`).join('\n')}` : ''}

Identify and explain:
1. How concepts in this document relate to other subjects
2. Connections to upcoming assignments
3. Prerequisite knowledge this material builds on
4. How studying this topic helps with other areas
5. Cross-subject connections and interdisciplinary relationships

Present this as a network of connections with clear explanations.`;

      case 'studyPlan':
        return `Based on this document, create a personalized study plan.

${upcomingAssignments ? `Upcoming Assignments:\n${upcomingAssignments}` : ''}

Create a study plan that includes:
1. Daily study schedule for the next 7 days
2. Which topics from this document to study each day
3. How much time to allocate per subject
4. Study methods and techniques for this material
5. Break times and review sessions
6. Priority order based on assignments and difficulty
7. Specific goals for each study session

Make it practical, actionable, and balanced to avoid burnout.`;

      default:
        return "Please analyze this document and provide helpful study insights.";
    }
  };

  const createMixedPrompt = async (mode, notes, assignments, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    switch (mode) {
      case 'summary':
        return await createSummaryPrompt(notes, uploadedContent);
      case 'insights':
        return await createInsightsPrompt(notes, assignments, uploadedContent);
      case 'questions':
        return await createQuestionsPrompt(notes, uploadedContent);
      case 'connections':
        return await createConnectionsPrompt(notes, assignments, uploadedContent);
      case 'studyPlan':
        return await createStudyPlanPrompt(notes, assignments, uploadedContent);
      default:
        return await createSummaryPrompt(notes, uploadedContent);
    }
  };

  const generateAnalysis = async () => {
    if (selectedNotes.length === 0 && uploadedFiles.length === 0) {
      alert('Please select at least one note or upload a file to analyze');
      return;
    }

    setLoading(true);
    const selectedNotesData = getSelectedNotesContent();

    try {
      let response = '';
      
      // Check if we have any Gemini-uploaded files (PDFs or images)
      const geminiUploadedFiles = uploadedGeminiFiles.filter(file => file.geminiFile);
      console.log('Analysis mode:', analysisMode);
      console.log('Selected notes:', selectedNotes.length);
      console.log('Uploaded files:', uploadedFiles.length);
      console.log('Gemini uploaded files:', geminiUploadedFiles.length);
      
      if (geminiUploadedFiles.length > 0 && selectedNotes.length === 0) {
        // Use Gemini Files API for PDF/image analysis
        console.log('Using Gemini Files API for analysis');
        const prompt = await createPromptForFiles(analysisMode, assignments);
        const geminiFile = geminiUploadedFiles[0].geminiFile; // Use first file for now
        console.log('Calling Gemini with file:', geminiFile.name);
        response = await callGeminiWithFile(prompt, geminiFile, getSystemPrompt(analysisMode));
      } else if (geminiUploadedFiles.length > 0 && selectedNotes.length > 0) {
        // Mix of files and notes - extract file content and combine
        console.log('Using mixed content (files + notes)');
        const uploadedContent = await extractContentFromUploadedFiles();
        const prompt = await createMixedPrompt(analysisMode, selectedNotesData, assignments, uploadedContent);
        response = await callGemini(prompt, getSystemPrompt(analysisMode));
      } else {
        // Notes only or non-PDF files
        console.log('Using regular content analysis');
        const uploadedContent = await extractContentFromUploadedFiles();
        const prompt = await createMixedPrompt(analysisMode, selectedNotesData, assignments, uploadedContent);
        response = await callGemini(prompt, getSystemPrompt(analysisMode));
      }
      
      console.log('Analysis response received');
      
      if (analysisMode === 'questions') {
        const questions = parseQuestions(response);
        setGeneratedQuestions(questions);
        setAnalysis(response);
      } else if (analysisMode === 'connections') {
        const parsedConnections = parseConnections(response);
        setConnections(parsedConnections);
        setAnalysis(response);
      } else if (analysisMode === 'studyPlan') {
        setStudyPlan(response);
        setAnalysis(response);
      } else {
        setAnalysis(response);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createSummaryPrompt = async (notes, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    return `You are a helpful AI study assistant. Based on the uploaded files and notes below, provide a comprehensive summary.

${uploadedContent ? 'The user has uploaded files that contain important study materials. Based on the file information (subject, topic, filename), provide a summary of what these materials likely cover and key concepts the student should focus on.' : ''}

Content to analyze:
${fullContent}

Please provide a comprehensive summary that includes:
1. Key concepts and main ideas (based on subject matter identified)
2. Important topics and themes likely covered
3. Study recommendations for this subject
4. How to approach learning this material

Format your response with clear headings and bullet points. Focus on giving actionable study guidance based on the subject matter.`;
  };

  const createInsightsPrompt = async (notes, assignments, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const upcomingAssignments = assignments.filter(a => new Date(a.dueDate) > new Date())
      .map(a => `${a.title} (${a.subject}) - Due: ${a.dueDate}`).join('\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    return `You are a helpful AI study assistant. Based on the uploaded files and notes below, provide actionable insights for learning.

${uploadedContent ? 'The user has uploaded files that contain important study materials. Analyze the file information and provide relevant study insights based on the subject matter indicated by the filenames.' : ''}

Content to analyze:
${fullContent}

${upcomingAssignments ? `Upcoming Assignments:\n${upcomingAssignments}` : ''}

Please provide:
1. Learning gaps or areas that need more attention
2. Strengths and well-understood topics  
3. Study priorities based on the content
4. Recommended study methods for these topics
5. Potential connections between different subjects

Format your response with clear sections and actionable advice. Focus on giving practical study recommendations based on the subject matter identified in the uploaded materials.`;
  };

  const createQuestionsPrompt = async (notes, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    return `You are a helpful AI study assistant. Based on the uploaded files and notes below, generate practice questions to test understanding.

${uploadedContent ? 'The user has uploaded files that contain important study materials. Based on the file information (subject, topic, filename), create relevant practice questions for this subject matter.' : ''}

Content to analyze:
${fullContent}

IMPORTANT: Create actual QUESTIONS that students can answer, not definitions or explanations. Each question should ask the student to DO something or demonstrate knowledge.

Generate exactly these types of questions:

MULTIPLE CHOICE (5 questions):
Format each as:
1. [Question text asking student to choose answer]
   A) [Option 1 text]
   B) [Option 2 text] 
   C) [Option 3 text]
   D) [Option 4 text]
   Correct Answer: [letter A, B, C, or D]
   Explanation: [brief explanation]

SHORT ANSWER (3 questions):
Format each as:
6. [Question that requires 1-2 sentence answer]
   Answer: [expected answer]
   
ESSAY/DISCUSSION (2 questions):
Format each as:
9. [Question requiring detailed explanation or comparison]
   Answer: [key points expected]

PROBLEM-SOLVING (2 questions):
Format each as:
11. [Mathematical problem to solve]
   Answer: [solution with steps]

CRITICAL: For multiple choice questions, you MUST provide 4 distinct options labeled A), B), C), D) and clearly mark which one is correct. Do NOT use bullet points or numbers for options.

Examples of GOOD multiple choice questions:
1. Which of the following is the correct negation of the statement "For all x, P(x)"?
   A) For all x, not P(x)
   B) There exists x such that not P(x)
   C) For all x, P(x)
   D) There exists x such that P(x)
   Correct Answer: B
   Explanation: The negation of a universal quantifier becomes an existential quantifier.

DO NOT include definitions, theorems, or proof steps as questions.

Create questions that test understanding of the key concepts in this subject area.`;
  };

  const createConnectionsPrompt = async (notes, assignments, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const assignmentTopics = assignments.map(a => `${a.title} (${a.subject})`).join('\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    return `You are a helpful AI study assistant. Based on the uploaded files and notes below, identify connections between topics and assignments.

${uploadedContent ? 'The user has uploaded files that contain important study materials. Based on the file information (subject, topic, filename), identify how this material connects to other subjects and assignments.' : ''}

Content to analyze:
${fullContent}

${assignmentTopics ? `Current Assignments:\n${assignmentTopics}` : ''}

Identify and explain:
1. How concepts in different materials relate to each other
2. Connections between uploaded materials and upcoming assignments
3. Prerequisite knowledge needed for this subject
4. How studying this topic helps with other subjects
5. Cross-subject connections and interdisciplinary relationships

Present this as a network of connections with clear explanations. Focus on practical learning connections.`;
  };

  const createStudyPlanPrompt = async (notes, assignments, uploadedContent) => {
    const notesText = notes.map(note => 
      `Title: ${note.title}\nSubject: ${note.subject || 'No subject'}\nContent: ${note.content.replace(/<[^>]*>/g, '')}`
    ).join('\n\n---\n\n');

    const upcomingAssignments = assignments.filter(a => new Date(a.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map(a => `${a.title} (${a.subject}) - Due: ${a.dueDate} - Priority: ${a.priority}`).join('\n');

    const fullContent = notesText + (uploadedContent ? `\n\n--- UPLOADED FILES ---\n\n${uploadedContent}` : '');

    return `You are a helpful AI study assistant. Based on the uploaded files and notes below, create a personalized study plan.

${uploadedContent ? 'The user has uploaded files that contain important study materials. Based on the file information (subject, topic, filename), create a study plan focused on mastering this subject matter.' : ''}

Content to analyze:
${fullContent}

${upcomingAssignments ? `Upcoming Assignments:\n${upcomingAssignments}` : ''}

Create a personalized study plan that includes:
1. Daily study schedule for the next 7 days
2. Which topics to study each day (focus on the subject identified)
3. How much time to allocate per subject
4. Study methods and techniques for this subject
5. Break times and review sessions
6. Priority order based on assignments and difficulty
7. Specific goals for each study session

Make it practical, actionable, and balanced to avoid burnout. Focus on the subject matter from the uploaded materials.`;
  };

  const parseQuestions = (response) => {
    const questions = [];
    const lines = response.split('\n');
    let currentQuestion = null;
    let questionType = 'multiple-choice';
    let collectingAnswer = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect section headers
      if (line.match(/MULTIPLE\s+CHOICE/i) || line.match(/Multiple\s+Choice/i)) {
        questionType = 'multiple-choice';
        continue;
      } else if (line.match(/SHORT\s+ANSWER/i) || line.match(/Short\s+Answer/i)) {
        questionType = 'short-answer';
        continue;
      } else if (line.match(/ESSAY|DISCUSSION/i)) {
        questionType = 'essay';
        continue;
      } else if (line.match(/PROBLEM[\s-]SOLVING/i)) {
        questionType = 'problem-solving';
        continue;
      }
      
      // Detect question start (number followed by period and actual question text)
      const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (questionMatch && questionMatch[2].length > 10) { // Ensure there's actual question text
        if (currentQuestion && currentQuestion.text) {
          questions.push(currentQuestion);
        }
        currentQuestion = { 
          type: questionType, 
          text: questionMatch[2], 
          options: [], 
          correct: null,
          explanation: '',
          answer: ''
        };
        collectingAnswer = false;
        continue;
      }
      
      // Collect multiple choice options (A), B), C), D))
      if (currentQuestion && currentQuestion.type === 'multiple-choice') {
        const optionMatch = line.match(/^([A-D])\)\s+(.+)/i);
        if (optionMatch && optionMatch[2].length > 1) {
          currentQuestion.options.push({
            letter: optionMatch[1].toUpperCase(),
            text: optionMatch[2]
          });
          continue;
        }
        
        // Detect correct answer
        const correctMatch = line.match(/Correct\s+Answer:\s*([A-D])/i);
        if (correctMatch) {
          currentQuestion.correct = correctMatch[1].toUpperCase();
          continue;
        }
        
        // Detect explanation
        const explanationMatch = line.match(/Explanation:\s*(.+)/i);
        if (explanationMatch) {
          currentQuestion.explanation = explanationMatch[1];
          continue;
        }
      }
      
      // Collect answers for written response questions
      if (currentQuestion && ['short-answer', 'essay', 'problem-solving'].includes(currentQuestion.type)) {
        const answerMatch = line.match(/Answer:\s*(.+)/i);
        if (answerMatch) {
          currentQuestion.answer = answerMatch[1];
          collectingAnswer = true;
          continue;
        }
        
        // Continue collecting multi-line answers
        if (collectingAnswer && line && !line.match(/^\d+\./) && line.length > 0) {
          currentQuestion.answer += ' ' + line;
        }
      }
    }
    
    // Add the last question if it's valid
    if (currentQuestion && currentQuestion.text && 
        ((currentQuestion.type === 'multiple-choice' && currentQuestion.options.length > 0) ||
         (['short-answer', 'essay', 'problem-solving'].includes(currentQuestion.type) && currentQuestion.answer))) {
      questions.push(currentQuestion);
    }
    
    // Filter out invalid questions
    return questions.filter(q => {
      if (!q.text || q.text.length < 10) return false;
      if (q.type === 'multiple-choice' && q.options.length < 2) return false;
      if (['short-answer', 'essay', 'problem-solving'].includes(q.type) && !q.answer) return false;
      return true;
    });
  };

  const parseConnections = (response) => {
    // Simple parsing of connections
    const connections = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('connects to') || line.includes('relates to') || line.includes('helps with')) {
        connections.push(line.trim());
      }
    }
    
    return connections;
  };

  // Markdown renderer function
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^####\s(.*)$/gm, '<h4 style="font-size:1rem;font-weight:700;margin:12px 0 6px;color:var(--text);">$1</h4>')
      .replace(/^###\s(.*)$/gm,  '<h3 style="font-size:1.1rem;font-weight:700;margin:16px 0 8px;color:var(--text);">$1</h3>')
      .replace(/^##\s(.*)$/gm,   '<h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h2>')
      .replace(/^#\s(.*)$/gm,    '<h1 style="font-size:1.3rem;font-weight:700;margin:20px 0 10px;color:var(--text);">$1</h1>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg3);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:.85em;">$1</code>')
      .replace(/^- (.*)$/gm, '<li style="margin:4px 0;">• $1</li>')
      .replace(/^\d+\. (.*)$/gm, '<li style="margin:4px 0;">$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  const renderAnalysis = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid var(--border)', 
            borderTop: '4px solid var(--accent)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: darkMode ? 'var(--text2)' : 'var(--text3)' }}>
            Analyzing your files...
          </p>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: darkMode ? 'var(--text3)' : 'var(--text4)' }}>📊</div>
          <p style={{ color: darkMode ? 'var(--text2)' : 'var(--text3)' }}>
            Select notes or upload files and choose an analysis type to get started
          </p>
        </div>
      );
    }

    return (
      <div className="analysis-result">
        {analysisMode === 'questions' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>Generated Practice Questions</h3>
            {generatedQuestions.map((q, idx) => (
              <div key={idx} style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                background: darkMode ? 'var(--bg3)' : 'var(--bg)',
                borderRadius: '10px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '12px' }}>
                  {idx + 1}. {q.text}
                </div>
                
                {/* Multiple Choice Questions */}
                {q.options && q.options.length > 0 && (
                  <div style={{ marginLeft: '16px' }}>
                    {q.options.map((opt, optIdx) => {
                      const optionLetter = opt.letter;
                      const isSelected = userAnswers[idx] === optionLetter;
                      const isCorrect = optionLetter === q.correct;
                      const showResult = showResults[idx];
                      
                      return (
                        <div
                          key={optIdx}
                          onClick={() => !showResult && handleMultipleChoiceAnswer(idx, optionLetter)}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            border: `2px solid ${
                              showResult && isCorrect ? '#10b981' :
                              showResult && isSelected && !isCorrect ? '#ef4444' :
                              isSelected ? 'var(--accent)' :
                              darkMode ? 'var(--border)' : '#d1d5db'
                            }`,
                            borderRadius: '8px',
                            background: showResult && isCorrect ? '#10b98110' :
                                       showResult && isSelected && !isCorrect ? '#ef444410' :
                                       isSelected ? 'var(--accent)10' :
                                       darkMode ? 'var(--card)' : 'white',
                            cursor: showResult ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => {
                            if (!showResult) {
                              e.currentTarget.style.background = darkMode ? 'var(--bg3)' : '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!showResult) {
                              e.currentTarget.style.background = isSelected ? 'var(--accent)10' : (darkMode ? 'var(--card)' : 'white');
                            }
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `2px solid ${
                              showResult && isCorrect ? '#10b981' :
                              showResult && isSelected && !isCorrect ? '#ef4444' :
                              isSelected ? 'var(--accent)' :
                              darkMode ? 'var(--border)' : '#d1d5db'
                            }`,
                            background: isSelected ? (
                              showResult && isCorrect ? '#10b981' :
                              showResult && !isCorrect ? '#ef4444' :
                              'var(--accent)'
                            ) : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            {isSelected && (showResult ? (isCorrect ? '✓' : '✗') : optionLetter)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ 
                              fontWeight: showResult && isCorrect ? '600' : 'normal',
                              color: darkMode ? 'var(--text)' : 'inherit'
                            }}>
                              <strong>{optionLetter})</strong> {opt.text}
                            </span>
                          </div>
                          {showResult && isCorrect && (
                            <span style={{ color: '#10b981', fontWeight: '600', fontSize: 'var(--fs-sm)' }}>
                              ✓ Correct
                            </span>
                          )}
                          {showResult && !isCorrect && isSelected && (
                            <span style={{ color: '#ef4444', fontWeight: '600', fontSize: 'var(--fs-sm)' }}>
                              ✗ Wrong
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {showResults[idx] && q.explanation && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: darkMode ? 'var(--bg2)' : '#f3f4f6', 
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--accent)',
                        fontSize: 'var(--fs-sm)',
                        color: darkMode ? 'var(--text2)' : 'var(--text3)'
                      }}>
                        <strong style={{ color: 'var(--accent)' }}>💡 Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Text Answer Questions */}
                {(!q.options || q.options.length === 0) && q.answer && (
                  <div style={{ marginLeft: '16px' }}>
                    <textarea
                      placeholder={q.type === 'essay' ? "Write your detailed answer here..." : "Type your answer here..."}
                      value={userTextAnswers[idx] || ''}
                      onChange={(e) => handleTextAnswer(idx, e.target.value)}
                      disabled={showResults[idx]?.shown}
                      style={{
                        width: '100%',
                        minHeight: q.type === 'essay' ? '120px' : '80px',
                        padding: '12px',
                        border: `2px solid ${
                          showResults[idx]?.shown ? 
                            (showResults[idx]?.isCorrect ? '#10b981' : '#ef4444') : 
                            (darkMode ? 'var(--border)' : '#d1d5db')
                        }`,
                        borderRadius: '8px',
                        background: darkMode ? 'var(--card)' : 'white',
                        color: darkMode ? 'var(--text)' : 'inherit',
                        fontSize: 'var(--fs-sm)',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {!showResults[idx]?.shown && (
                        <button
                          onClick={() => checkTextAnswerWithAI(idx, q)}
                          disabled={!userTextAnswers[idx]?.trim() || checkingAnswer}
                          style={{
                            padding: '10px 20px',
                            background: userTextAnswers[idx]?.trim() && !checkingAnswer ? 'var(--accent)' : (darkMode ? 'var(--bg3)' : '#e5e7eb'),
                            color: userTextAnswers[idx]?.trim() && !checkingAnswer ? 'white' : (darkMode ? 'var(--text3)' : '#9ca3af'),
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: 'var(--fs-sm)',
                            fontWeight: '600',
                            cursor: userTextAnswers[idx]?.trim() && !checkingAnswer ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            alignSelf: 'flex-start'
                          }}
                        >
                          {checkingAnswer ? 'Checking...' : '✓ Check Answer'}
                        </button>
                      )}
                      {showResults[idx]?.shown && (
                        <div style={{ 
                          padding: '16px', 
                          background: showResults[idx]?.isCorrect ? '#10b98115' : '#ef444415',
                          border: `2px solid ${showResults[idx]?.isCorrect ? '#10b981' : '#ef4444'}`,
                          borderRadius: '8px',
                          fontSize: 'var(--fs-sm)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <span style={{ 
                              fontSize: '20px',
                              color: showResults[idx]?.isCorrect ? '#10b981' : '#ef4444'
                            }}>
                              {showResults[idx]?.isCorrect ? '✓' : '✗'}
                            </span>
                            <span style={{ 
                              color: showResults[idx]?.isCorrect ? '#10b981' : '#ef4444', 
                              fontWeight: '700',
                              fontSize: 'var(--fs-md)'
                            }}>
                              {showResults[idx]?.isCorrect ? 'Correct!' : 'Incorrect'}
                            </span>
                          </div>
                          <div style={{ 
                            color: darkMode ? 'var(--text2)' : 'var(--text3)',
                            lineHeight: '1.5'
                          }}>
                            <strong>Feedback:</strong> {showResults[idx]?.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {analysisMode === 'connections' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>Topic Connections</h3>
            {connections.map((conn, idx) => (
              <div key={idx} style={{ 
                marginBottom: '12px', 
                padding: '12px', 
                background: darkMode ? 'var(--bg3)' : 'var(--bg)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--accent)'
              }}>
                🔗 {conn}
              </div>
            ))}
          </div>
        )}
        
        {analysisMode === 'studyPlan' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>Personalized Study Plan</h3>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
          </div>
        )}
        
        {['summary', 'insights'].includes(analysisMode) && (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis) }} />
        )}
      </div>
    );
  };

  return (
    <div className="ai-note-analyzer">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: 'var(--fs-xl)', 
          fontWeight: 'var(--fw-bold)',
          color: darkMode ? 'var(--text)' : 'var(--text)',
          marginBottom: '8px'
        }}>
          🧠 AI Note Analyzer
        </h2>
        <p style={{ 
          color: darkMode ? 'var(--text2)' : 'var(--text3)',
          fontSize: 'var(--fs-md)'
        }}>
          Get AI-powered insights from your study notes
        </p>
      </div>

      {/* Analysis Mode Selection */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          {[
              { id: 'summary', label: 'Summary' },
              { id: 'insights', label: 'Insights' },
              { id: 'questions', label: 'Questions' },
              { id: 'connections', label: 'Connections' },
              { id: 'studyPlan', label: 'Study Plan' }
            ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setAnalysisMode(mode.id)}
              style={{
                padding: '10px 16px',
                border: `1.5px solid ${analysisMode === mode.id ? 'var(--accent)' : (darkMode ? 'var(--border)' : 'var(--border2)')}`,
                borderRadius: '10px',
                background: analysisMode === mode.id ? 'var(--accent)' : (darkMode ? 'var(--card)' : 'var(--bg2)'),
                color: analysisMode === mode.id ? 'white' : (darkMode ? 'var(--text)' : 'var(--text)'),
                fontSize: 'var(--fs-sm)',
                fontWeight: 'var(--fw-semibold)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: 'var(--fs-lg)', 
          fontWeight: 'var(--fw-semibold)',
          color: darkMode ? 'var(--text)' : 'var(--text)',
          marginBottom: '12px'
        }}>
          Upload Files ({uploadedFiles.length} uploaded)
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              background: darkMode ? 'var(--card)' : 'var(--bg2)',
              border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
              borderRadius: '10px',
              fontSize: 'var(--fs-sm)',
              fontWeight: 'var(--fw-semibold)',
              cursor: 'pointer',
              color: darkMode ? 'var(--text)' : 'var(--text)',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = darkMode ? 'var(--bg3)' : 'var(--bg)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = darkMode ? 'var(--card)' : 'var(--bg2)';
            }}
          >
            + Choose Files
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
          </label>
          <span style={{ 
            fontSize: 'var(--fs-xs)', 
            color: darkMode ? 'var(--text3)' : 'var(--text4)',
            marginLeft: '12px'
          }}>
            Supported: TXT, PDF, DOC, DOCX, JPG, PNG, GIF (Max 10MB)
          </span>
        </div>

        {uploadedFiles.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '12px',
            background: darkMode ? 'var(--bg3)' : 'var(--bg)',
            border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: '10px'
          }}>
            {uploadedFiles.map(file => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: darkMode ? 'var(--card)' : 'var(--bg2)',
                  border: `1px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)' }}>
                    {file.type.startsWith('image/') ? '🖼️' : 
                     file.type.includes('pdf') ? '📄' : 
                     file.type.includes('word') ? '📝' : 
                     file.type.includes('text') ? '📄' : '📎'}
                  </span>
                  <div>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-medium)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: darkMode ? 'var(--text3)' : 'var(--text4)' }}>
                      {Math.round(file.size / 1024)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeUploadedFile(file.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Selection */}
      <div style={{ marginBottom: '24px' }}>
        {(() => {
          const totalItems = selectedNotes.length + uploadedFiles.length;
          const selectionText = selectedNotes.length > 0 && uploadedFiles.length > 0 
            ? `${selectedNotes.length} notes + ${uploadedFiles.length} files`
            : selectedNotes.length > 0 
            ? `${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''}`
            : `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`;

          return (
            <div>
              <h3 style={{ 
                fontSize: 'var(--fs-lg)', 
                fontWeight: 'var(--fw-semibold)',
                color: darkMode ? 'var(--text)' : 'var(--text)',
                marginBottom: '12px'
              }}>
                Items to Analyze ({selectionText})
              </h3>
              
              {notes.length === 0 && uploadedFiles.length === 0 ? (
                <p style={{ 
                  color: darkMode ? 'var(--text3)' : 'var(--text4)',
                  fontStyle: 'italic'
                }}>
                  No notes or files available. Create some notes or upload files to analyze them.
                </p>
              ) : notes.length === 0 ? (
                <p style={{ 
                  color: darkMode ? 'var(--text3)' : 'var(--text4)',
                  fontStyle: 'italic',
                  marginBottom: '12px'
                }}>
                  No notes available. Create some notes first to analyze them.
                </p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '12px',
                  background: darkMode ? 'var(--bg3)' : 'var(--bg)',
                  border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
                  borderRadius: '10px'
                }}>
                  {notes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteSelection(note.id)}
                      style={{
                        padding: '12px',
                        border: `1.5px solid ${selectedNotes.includes(note.id) ? 'var(--accent)' : (darkMode ? 'var(--border)' : 'var(--border2)')}`,
                        borderRadius: '8px',
                        background: selectedNotes.includes(note.id) ? (darkMode ? 'var(--accent)' : 'var(--accent2)') + '20' : (darkMode ? 'var(--card)' : 'var(--bg2)'),
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedNotes.includes(note.id)}
                          onChange={() => handleNoteSelection(note.id)}
                          style={{ margin: 0 }}
                        />
                        <span style={{ 
                          fontSize: 'var(--fs-sm)', 
                          fontWeight: 'var(--fw-semibold)',
                          color: darkMode ? 'var(--text)' : 'var(--text)'
                        }}>
                          {note.title}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: 'var(--fs-xs)', 
                        color: darkMode ? 'var(--text3)' : 'var(--text4)',
                        marginLeft: '24px'
                      }}>
                        {note.subject && `Subject: ${note.subject}`}
                        {note.attachments && note.attachments.length > 0 && ` • ${note.attachments.length} attachments`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Action Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={generateAnalysis}
          disabled={selectedNotes.length === 0 && uploadedFiles.length === 0 || loading}
          style={{
            padding: '12px 24px',
            background: (selectedNotes.length > 0 || uploadedFiles.length > 0) && !loading ? 'var(--accent)' : (darkMode ? 'var(--bg3)' : 'var(--bg)'),
            color: (selectedNotes.length > 0 || uploadedFiles.length > 0) && !loading ? 'white' : (darkMode ? 'var(--text3)' : 'var(--text4)'),
            border: `1.5px solid ${darkMode ? 'var(--border)' : 'var(--border2)'}`,
            borderRadius: '10px',
            fontSize: 'var(--fs-md)',
            fontWeight: 'var(--fw-semibold)',
            cursor: (selectedNotes.length > 0 || uploadedFiles.length > 0) && !loading ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-base)'
          }}
        >
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      {/* Results */}
      {renderAnalysis()}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AINoteAnalyzer;
