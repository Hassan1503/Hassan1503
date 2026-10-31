# Md Hassanuzzaman

**PhD Candidate · Electrical &amp; Computer Engineering · Duke University**  
Machine learning for physiological signals — [Kamaleswaran Lab](https://www.kamaleswaran.com/), Duke University School of Medicine

[Website](https://hassan1503.github.io/Hassan1503/) · [Google Scholar](https://scholar.google.com/citations?user=q1ppZrsAAAAJ&hl=en) · [Scholars@Duke](https://scholars.duke.edu/person/Md.Hassanuzzaman) · [ResearchGate](https://www.researchgate.net/profile/Md-Hassanuzzaman) · [LinkedIn](https://www.linkedin.com/in/md-hassanuzzaman-b31218b0/)

---

I build methods that turn raw physiological recordings into reliable clinical decisions. My thesis
develops automated screening for **congenital heart disease** from heart sounds, designed to hold up
on inexpensive stethoscopes in settings where echocardiography is out of reach. Alongside it I work
on **multimodal foundation models** that learn shared representations across ECG, PPG and other
clinical signals.

I am advised by [Dr. Rishikesan Kamaleswaran](https://scholars.duke.edu/person/rishikesan.kamaleswaran)
and supported by an ECE Departmental Fellowship. Before Duke I read for an MSc in Digital Health at
the University of Bristol on a Think Big Postgraduate Scholarship.

## Research

My work runs along one line: from the instrument that records a physiological signal, through the
data it produces and the tools that make that data usable, to the models trained on it. Each stage
left something behind that other people can use — a device, a dataset, a toolbox, a model.

| | | |
|:--|:--|:--|
| **2019 — 2021** | **Device** · A wearable ECG for continuous monitoring | A three-lead belt streaming over Wi-Fi, with interval analysis and a live companion app. I designed the analog front-end. BSc thesis; finalist, IEEE Region 10 Humanitarian Technology Project Competition. <br>*TnR Lab, North South University* |
| **2022 — 2025** | **Data** · Paediatric congenital heart disease from heart sounds | Leading a two-member clinical team, I designed the protocol and gathered 3,000+ simultaneous ECG and phonocardiogram recordings from ~700 patients across two hospitals. It supported a transformer 1D-CNN at 0.92 accuracy / 0.96 AUC on 484 patients, a five-second minimum-segment result (93.7%), and a feature-fusion model on 751 subjects. <br>*BIMS Lab, United International University* |
| **2024 — present** | **Toolbox** · Multimodal Physiology Toolbox | Cardiorespiratory physiomarkers from ECG, PPG, respiratory and arterial pressure waveforms. I cut extraction time ~70% with multithreaded parallel execution and built the web application that exports 200+ physiomarkers. Registered as a Duke technology (Ref. T-008998). <br>*Kamaleswaran Lab, Duke University* |
| **2025 — present** | **Model** · CardioFM | A self-supervised foundation model learning a joint ECG–PPG representation with cross-modal attention and a vector-quantised tokeniser, pretrained on multi-site hospital recordings. I designed the architecture, built the distributed multi-GPU pipeline, and lead the eight-member team. Under review. <br>*Kamaleswaran Lab, Duke University* |

Alongside: skin-tone bias in skin-cancer classifiers (disparate impact 0.58 and 0.68 against the
0.80 threshold, University of Bristol); histology and psoriasis segmentation (IoU above 90%,
King's College London); and physiological sensing from a smartphone (TnR Lab).

## Selected publications

<!-- PUBS:START -->
Work I led, work with ten or more citations, and work from this year, where the venue is citable — newest first. Citation counts come from Google Scholar.
[Full list of 16, with BibTeX, on the site &rarr;](https://hassan1503.github.io/Hassan1503/#publications)

1. **Clin-JEPA: A Multi-Phase Co-Training Framework for Joint-Embedding Predictive Pretraining on EHR Patient Trajectories**  
   Y Yang, M Arora, R Zhang, B Abed, J Kim, T Choudhary et al.  
   *arXiv:2605.10840*, 2026 · [paper](https://arxiv.org/abs/2605.10840) · 3 citations
2. **CardioFM: A Multimodal Foundation Model for Joint ECG and PPG Representation Learning**  
   **Md Hassanuzzaman**, Tilendra Choudhary, Alasdair Gent, Mihai V. Podgoreanu, Suresh Agarwal, Vijay Krishnamoorthy, Sivasubramanium V. Bhavani, Philip Yang, Annette M. Esper, Rishikesan Kamaleswaran  
   *Research Square (preprint rs-9652631)*, 2026 · [doi:10.21203/rs.3.rs-9652631/v1](https://doi.org/10.21203/rs.3.rs-9652631/v1) · 3 citations
3. **MMMuLNet: Multimodal Mutual Deep learning Framework for the Pediatric Congenital Heart Disease Detection**  
   A Jabbar, **M Hassanuzzaman**, KI Ahmad, R Mostafa, AH Khandoker et al.  
   *IEEE Journal of Biomedical and Health Informatics*, 2026
4. **Classification of Short-Segment Pediatric Heart Sounds Based on a Transformer-Based Convolutional Neural Network**  
   **Md Hassanuzzaman**, Samit Kumar Ghosh, Mohammad Nurul Akhtar Hasan, Mohammad Abdullah Al Mamun, Khawza Iftekhar Uddin Ahmed, Raqibul Mostafa, Ahsan Habib Khandoker  
   *IEEE Access*, vol. 13, pp. 93852–93868, 2025 · [doi:10.1109/ACCESS.2025.3573870](https://doi.org/10.1109/ACCESS.2025.3573870) · 23 citations
5. **Automated detection of pediatric congenital heart disease from phonocardiograms using deep and handcrafted feature fusion**  
   Abdul Jabbar, Ethan Grooby, Yang Yi Poh, Khawza I. Ahmad, **Md Hassanuzzaman**, Raqibul Mostafa, Ahsan Habib Khandoker, Faezeh Marzbanrad  
   *Computers in Biology and Medicine*, vol. 197, 110993, 2025 · [doi:10.1016/j.compbiomed.2025.110993](https://doi.org/10.1016/j.compbiomed.2025.110993) · [paper](https://dukespace.lib.duke.edu/server/api/core/bitstreams/d5afd6a1-4f6f-4ca8-ae68-c888842b0faf/content) · 14 citations
6. **Skin Cancer Machine Learning Model Tone Bias**  
   James Pope, **Md Hassanuzzaman**, William Chapman, Huw Day, Mingmar Sherpa, Omar Emara, Nirmala Adhikari, Ayush Joshi  
   *arXiv:2410.06385*, 2024 · [doi:10.48550/arXiv.2410.06385](https://doi.org/10.48550/arXiv.2410.06385) · [paper](https://arxiv.org/abs/2410.06385) · 13 citations
7. **Recognition of Pediatric Congenital Heart Diseases by Using Phonocardiogram Signals and Transformer-Based Neural Networks**  
   **Md Hassanuzzaman**, Nurul Akhtar Hasan, Mohammad Abdullah Al Mamun, Mohanad Alkhodari, Khawza Iftekhar Uddin Ahmed, Ahsan Habib Khandoker, Raqibul Mostafa  
   *45th Annual International Conference of the IEEE Engineering in Medicine & Biology Society (EMBC)*, 2023 · [doi:10.1109/EMBC40787.2023.10340370](https://doi.org/10.1109/EMBC40787.2023.10340370) · 19 citations
8. **A Deep Learning Model for Recognizing Pediatric Congenital Heart Diseases Using Phonocardiogram Signals**  
   **Md Hassanuzzaman**, Nurul Akhtar Hasan, Mohammad Abdullah Al Mamun, Khawza Iftekhar Uddin Ahmed, Ahsan Habib Khandoker, Raqibul Mostafa  
   *Computing in Cardiology (CinC)*, vol. 50, pp. 1–4, 2023 · [doi:10.22489/CinC.2023.146](https://doi.org/10.22489/CinC.2023.146) · 3 citations
9. **Blood Glucose Level Regression for Smartphone PPG Signals Using Machine Learning**  
   Tanvir Tazul Islam, Md. Sibbir Ahmed, **Md Hassanuzzaman**, Syed Athar Bin Amir, Tanzilur Rahman  
   *Applied Sciences*, vol. 11, no. 2, 618, 2021 · [doi:10.3390/app11020618](https://doi.org/10.3390/app11020618) · 90 citations
10. **An Efficient Surface Map Creation and Tracking Using Smartphone Sensors and Crowdsourcing**  
    Md. Rabiul Ali Sarker, **Md Hassanuzzaman**, Purnendu Biswas, Saikot Hossain Dadon, Tasmina Imam, Tanzilur Rahman  
    *Sensors*, vol. 21, no. 21, 6969, 2021 · [doi:10.3390/s21216969](https://doi.org/10.3390/s21216969) · 11 citations
11. **End to End Solution for Continuous Monitoring and Real-Time Analysis of Vital Signs from ECG Signal**  
    **Md Hassanuzzaman**, Purnendu Biswas, Tanzilur Rahman  
    *IEEE R10 Humanitarian Technology Conference (R10-HTC)*, pp. 55–60, 2019 · [doi:10.1109/R10-HTC47129.2019.9042478](https://doi.org/10.1109/R10-HTC47129.2019.9042478) · 8 citations
<!-- PUBS:END -->

## Education

| Years | Degree | Institution |
|:--|:--|:--|
| 2025 — 2029 (expected) | PhD, Electrical &amp; Computer Engineering | Duke University |
| 2023 — 2024 | MSc, Digital Health (Merit) | University of Bristol |
| 2014 — 2018 | BSc, Electrical &amp; Electronic Engineering | North South University |

## Recognition

- **Full departmental fellowship**, Electrical & Computer Engineering, Duke University — 2025
- **MSc Digital Health awarded with Merit**, University of Bristol — 2024
- **Think Big Postgraduate Scholarship**, University of Bristol — 2023
- **Finalist**, IEEE Region 10 Humanitarian Technology Project Competition — 2019
- **50% merit scholarship**, North South University — 2014

## Contact

I am glad to hear from researchers working on physiological signals, clinical foundation models, or
screening in low-resource settings — and from students considering this area.

[md.hassanuzzaman@duke.edu](mailto:md.hassanuzzaman@duke.edu) · ORCID [0000-0002-4751-3773](https://orcid.org/0000-0002-4751-3773) · [Scholars@Duke](https://scholars.duke.edu/person/Md.Hassanuzzaman) · [LinkedIn](https://www.linkedin.com/in/md-hassanuzzaman-b31218b0/)

<sub>This profile and the [accompanying site](https://hassan1503.github.io/Hassan1503/) are built
from this repository. The figure above is a synthesised phonocardiogram; the code that draws it is in
<code>scripts/build_banner.py</code>.</sub>
