/* Single source of truth for the profile content rendered by app.js.
   Citation counts here are the fallback (Semantic Scholar, Sept 2026);
   assets/data/scholar.json, when present, overrides them with Google
   Scholar figures. */
window.SITE = {
  name: 'Md Hassanuzzaman',
  updated: '2026-09-01',
  scholarUrl: 'https://scholar.google.com/citations?user=q1ppZrsAAAAJ&hl=en',
  citationSource: { label: 'Semantic Scholar', url: 'https://www.semanticscholar.org/', date: '2026-09-01' },

  topics: [
    { tag: 'chd', name: 'Congenital Heart Disease Detection',
      text: 'Automated screening of pediatric CHD from heart sounds, with an emphasis on generalization to diverse, low-resource clinical settings.' },
    { tag: 'pcg', name: 'Phonocardiogram Analysis',
      text: 'Segmentation, signal-quality assessment and feature extraction for heart-sound recordings; how little signal is enough for a reliable decision.' },
    { tag: 'signal-processing', name: 'Biomedical Signal Processing',
      text: 'Denoising, MFCC and time-frequency representations, and fusing handcrafted descriptors with learned features.' },
    { tag: 'deep-learning', name: 'Deep Learning for Biomedical Signals',
      text: 'Residual 1D-CNNs and attention models for physiological time series, tuned for calibration and deployment on modest hardware.' },
    { tag: 'transformers', name: 'Transformer Architectures',
      text: 'Attention-based encoders over raw and spectral heart-sound inputs for classification of short recordings.' },
    { tag: 'rag', name: 'Multi-Agent RAG Systems',
      text: 'Collaborating LLM agents that retrieve, reason over and synthesize evidence from heterogeneous medical corpora. Ongoing work.' },
    { tag: 'llm', name: 'Multimodal Large Language Models',
      text: 'Joint reasoning over text, signals and images for clinical narrative generation and decision support. Ongoing work.' },
    { tag: 'global-health', name: 'Global Health & Low-Resource Screening',
      text: 'AI-driven digital stethoscopes as cost-effective screening tools where echocardiography is out of reach.' }
  ],

  publications: [
    {
      id: 'jabbar2025scalable', year: 2025, type: 'preprint',
      title: 'Congenital Heart Disease Classification Using Phonocardiograms: A Scalable Screening Tool for Diverse Environments',
      authors: 'A. Jabbar, E. Grooby, M. Hassanuzzaman, et al.',
      bibAuthors: 'Jabbar, Abdul and Grooby, Ethan and Hassanuzzaman, Md and others',
      venue: 'arXiv preprint arXiv:2503.22773', venueShort: 'arXiv',
      tags: ['chd', 'pcg', 'deep-learning', 'global-health'],
      cites: 1,
      links: [{ label: 'arXiv', url: 'https://arxiv.org/abs/2503.22773' }],
      abstract: 'Congenital heart disease (CHD) is a critical condition that demands early detection, particularly in infancy and childhood. This study presents a deep learning model designed to detect CHD using phonocardiogram (PCG) signals, with a focus on its application in global health. We evaluated our model on several datasets, including the primary dataset from Bangladesh, achieving a high accuracy of 94.1%, sensitivity of 92.7%, specificity of 96.3%. The model also demonstrated robust performance on the public PhysioNet Challenge 2022 and 2016 datasets, underscoring its generalizability to diverse populations and data sources. We assessed the performance of the algorithm for single and multiple auscultation sites on the chest, demonstrating that the model maintains over 85% accuracy even when using a single location. Furthermore, our algorithm was able to achieve an accuracy of 80% on low-quality recordings, which cardiologists deemed non-diagnostic. This research suggests that an AI-driven digital stethoscope could serve as a cost-effective screening tool for CHD in resource-limited settings, enhancing clinical decision support and ultimately improving patient outcomes.',
      bib: { type: 'misc', extra: { eprint: '2503.22773', archivePrefix: 'arXiv' } }
    },
    {
      id: 'jabbar2025fusion', year: 2025, type: 'journal',
      title: 'Automated Detection of Pediatric Congenital Heart Disease from Phonocardiograms Using Deep and Handcrafted Feature Fusion',
      authors: 'A. Jabbar, E. Grooby, M. Hassanuzzaman, et al.',
      bibAuthors: 'Jabbar, Abdul and Grooby, Ethan and Hassanuzzaman, Md and others',
      venue: 'Computers in Biology and Medicine', venueShort: 'CBM',
      tags: ['chd', 'pcg', 'signal-processing', 'deep-learning'],
      cites: 3,
      links: [{ label: 'PDF', url: 'https://dukespace.lib.duke.edu/server/api/core/bitstreams/d5afd6a1-4f6f-4ca8-ae68-c888842b0faf/content' }],
      abstract: 'Congenital heart disease (CHD) is the most common type of birth defect, impacting about 1% of live births worldwide. Echocardiography, the gold-standard diagnostic method, is costly and inaccessible in low-resource settings. Diagnosis is delayed due to limited skilled experts, whose ability to interpret pathological patterns varies significantly, causing inter- and intra-clinician variability. Therefore, we present a new method for a more accessible diagnostic modality, the digital stethoscope, to detect CHDs. Our method is based on deep feature fusion, integrating deep and handcrafted features for the automated early detection of CHDs. For this work, phonocardiography (PCG) recordings were obtained from 751 pediatric subjects (age 1 month to 16 years) in Bangladesh at four auscultation locations: mitral, aortic, pulmonary and tricuspid. These recordings were labeled based on confirmed diagnoses by cardiologists as either CHD or non-CHD. The proposed model achieved an accuracy of 92%, a sensitivity of 91%, and a specificity of 91% on a patient-wise split, with an AUROC of 96% and an F1-score of 92%. This model promises efficient real-time remote detection of CHDs as a cost-effective screening tool for low-resource settings.',
      bib: { type: 'article' }
    },
    {
      id: 'hassanuzzaman2024short', year: 2024, type: 'journal',
      title: 'Classification of Short-Segment Pediatric Heart Sounds Based on a Transformer-Based Convolutional Neural Network',
      authors: 'M. Hassanuzzaman, et al.',
      bibAuthors: 'Hassanuzzaman, Md and others',
      venue: 'IEEE Access', venueShort: 'IEEE Access',
      tags: ['chd', 'pcg', 'transformers', 'signal-processing'],
      cites: 13,
      links: [],
      highlight: '93.69% accuracy from 5-second segments',
      abstract: 'Congenital heart diseases (CHDs), caused by structural abnormalities in the heart and blood vessels, pose a significant public health concern and contribute significantly to the socioeconomic burden, particularly in pediatric populations. Phonocardiograms (PCGs), as a non-invasive and cost-effective diagnostic modality, capture vital acoustic signals that reflect the mechanical activity of the heart and can reveal pathological patterns associated with various CHD types. This study investigates the minimum signal duration required for accurate automatic classification of heart sounds and evaluates signal quality using the root mean square of successive differences (RMSSD) and the zero-crossing rate (ZCR). Mel-frequency cepstral coefficients (MFCCs) are extracted as features and fed into a transformer-based residual one-dimensional convolutional neural network (1D-CNN) for classification. Experimental results show that a threshold of 0.4 for RMSSD and ZCR yields optimal classification performance, with a minimum signal length of 5 seconds required for reliable results. Shorter segments (3 seconds) lack sufficient diagnostic information, while longer segments (15 seconds) may introduce additional noise. The proposed model achieves a maximum classification accuracy of 93.69% with 5-second signals.',
      bib: { type: 'article' }
    },
    {
      id: 'hassanuzzaman2024enhancing', year: 2024, type: 'chapter',
      title: 'Enhancing Healthcare Through AI, AR, and VR',
      authors: 'M. Hassanuzzaman, et al.',
      bibAuthors: 'Hassanuzzaman, Md and others',
      venue: 'Book chapter, Wiley', venueShort: 'Wiley',
      tags: ['healthcare-ai'],
      cites: null,
      links: [{ label: 'Chapter', url: 'https://onlinelibrary.wiley.com/doi/10.1002/9781394302864.ch10' }],
      bib: { type: 'incollection', extra: { publisher: 'Wiley', doi: '10.1002/9781394302864.ch10' } }
    },
    {
      id: 'hassanuzzaman2023transformer', year: 2023, type: 'conference',
      title: 'Recognition of Pediatric Congenital Heart Diseases by Using Phonocardiogram Signals and Transformer-Based Neural Networks',
      authors: 'M. Hassanuzzaman, et al.',
      bibAuthors: 'Hassanuzzaman, Md and others',
      venue: 'Proc. 45th Annual International Conference of the IEEE Engineering in Medicine & Biology Society (EMBC)', venueShort: 'IEEE EMBC',
      tags: ['chd', 'pcg', 'transformers', 'deep-learning'],
      cites: 12,
      links: [],
      highlight: '92.3% accuracy, 97.3% sensitivity on raw PCG',
      abstract: 'The phonocardiogram (PCG) or heart sound auscultation is a low-cost and non-invasive method to diagnose Congenital Heart Disease (CHD). However, recognizing CHD in the pediatric population based on heart sounds is difficult because it requires high medical training and skills. Also, the dependency of PCG signal quality on sensor location and developing heart in children are challenging. This study proposed a deep learning model that classifies unprocessed or raw PCG signals to diagnose CHD using a one-dimensional Convolution Neural Network (1D-CNN) with an attention transformer. The model was built on the raw PCG data of 484 patients. The results showed that the attention transformer model had a good balance of accuracy of 0.923, a sensitivity of 0.973, and a specificity of 0.833. The ROC plot generated an AUC value of 0.964, and the F1-score was 0.939. The suggested model could provide quick and appropriate real-time remote diagnosis in classifying PCG of CHD from non-CHD subjects, and can be utilized by rural doctors as a first screening tool before referring cases to experts.',
      bib: { type: 'inproceedings' }
    },
    {
      id: 'hassanuzzaman2023cinc', year: 2023, type: 'conference',
      title: 'A Deep Learning Model for Recognizing Pediatric Congenital Heart Diseases Using Phonocardiogram Signals',
      authors: 'M. Hassanuzzaman, et al.',
      bibAuthors: 'Hassanuzzaman, Md and others',
      venue: 'Computing in Cardiology (CinC)', venueShort: 'CinC',
      tags: ['chd', 'pcg', 'deep-learning', 'signal-processing'],
      cites: 2,
      links: [],
      highlight: '1D-CNN with residual blocks; 15 s of PCG, 4.2 ms inference',
      abstract: 'Diagnosing congenital heart disease (CHD) in children through heart sound auscultation requires extensive medical training and understanding. However, the quality of PCG data may be compromised due to the sensor location, a child’s developing heart, and the complex and changeable cardiac acoustic environment. This study proposes a one-dimensional Convolution Neural Network (1D-CNN) with a residual block that classifies PCG signals to predict heart abnormalities in 751 patients with PCG signals aged five months to twenty years. After assessing the signal quality, only good-quality signals are used as input features of the neural network. The study’s results showed an accuracy of 0.93 and a sensitivity of 0.98. The ROC plot yielded an AUC value of 0.98, and the F1-score was 0.94. The proposed model required only 15 s of the PCG signal to predict CHD cases (4.2 ms processing time). Thus, it can be implemented as a primary screening tool for remote-end pediatricians by providing cheaper and faster interpretations of PCG signals before referring the cases to specialists.',
      bib: { type: 'inproceedings' }
    }
  ],

  timeline: [
    { from: '2023', to: 'Present', title: 'PhD Candidate, Electrical & Computer Engineering', org: 'Duke University', loc: 'Durham, NC, USA', current: true,
      details: ['Advisor: Dr. Rishikesan Kamaleswaran, Associate Professor, Duke University School of Medicine', 'Supported by an ECE departmental fellowship', 'Research: signal processing, deep learning and healthcare AI; CHD detection from phonocardiograms; multi-agent RAG and multimodal LLM systems'] },
    { from: '2023', to: 'Present', title: 'Graduate Researcher', org: 'Kamaleswaran Lab, Duke University School of Medicine', loc: 'Durham, NC, USA', current: true,
      details: ['Deep learning models for pediatric CHD screening from heart-sound recordings', 'Collaboration across the medical school and the ECE department on translational AI for global health'] },
    { from: '2021', to: '2022', title: 'MSc, Digital Health', org: 'University of Bristol', loc: 'Bristol, UK', current: false,
      details: ['Awarded the Think Big Postgraduate Scholarship'] }
  ]
};
