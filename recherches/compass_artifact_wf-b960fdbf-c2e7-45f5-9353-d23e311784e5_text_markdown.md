# Stratégie juridique data pour Satorea : maximiser l'exploitation des données CRM en conformité RGPD

**Satorea peut légalement exploiter une part significative des données transitant par sa plateforme, à condition d'architecturer rigoureusement une double qualification juridique et un pipeline d'anonymisation robuste.** L'analyse croisée du RGPD, de la jurisprudence CJUE, des sanctions CNIL 2023-2025 et des pratiques concurrentielles révèle que la frontière entre sous-traitant et responsable de traitement est devenue fonctionnelle — chaque traitement se qualifie indépendamment. La sanction MOBIUS/Deezer (1 M€, décembre 2025) pour réutilisation non autorisée de données clients illustre précisément le risque que Satorea doit éviter, tandis que le modèle HubSpot démontre qu'une double qualification transparente est praticable à l'échelle industrielle.

---

## BLOC 1 — Qualification juridique : la double casquette est le modèle optimal

### Q1 — Double qualification sous-traitant et responsable de traitement

**OUI — Légal et expressément reconnu par l'EDPB et la CNIL, sous conditions strictes de segmentation.**

Le RGPD ne l'interdit pas ; il le prévoit. L'article **28(10)** dispose que si un sous-traitant détermine les finalités et moyens d'un traitement, il est considéré comme responsable de traitement pour ce traitement spécifique. Les **Guidelines EDPB 07/2020** (version finale juillet 2021) reconnaissent explicitement qu'une même entité peut cumuler les qualifications pour des traitements distincts. La qualification est **fonctionnelle** : traitement par traitement, selon qui décide des finalités et des moyens essentiels.

La CNIL a publié le **12 janvier 2022** une position officielle sur la réutilisation des données par un sous-traitant, posant deux conditions cumulatives : **autorisation écrite** du responsable de traitement initial et **test de compatibilité** avec la finalité initiale (art. 6(4) RGPD). La CNIL précise que l'amélioration des services cloud « pourrait être compatible avec le traitement initial, sous réserve de garanties appropriées (pseudonymisation/anonymisation) ».

La **délibération SAN-2022-009 (Dedalus Biologie, 1,5 M€)** constitue le précédent majeur : le sous-traitant éditeur de logiciels a été sanctionné pour avoir outrepassé les instructions du responsable de traitement lors d'une migration. Plus récemment, **MOBIUS Solutions (SAN-2025-014, 1 M€)** a été sanctionnée pour avoir copié et utilisé les données de Deezer sans instruction documentée pour améliorer ses propres services.

**Architecture recommandée pour Satorea :**

| Traitement | Qualification | Base légale |
|---|---|---|
| Données CRM clients TPE (fiches, RDV, historique soins) | Sous-traitant (art. 28) | Contrat de sous-traitance |
| Données d'usage plateforme (logs, analytics, métriques) | Responsable de traitement | Intérêt légitime (art. 6.1.f) |
| Données agrégées pour amélioration produit | RT si anonymisées ; ST avec autorisation si pseudonymisées | Intérêt légitime + test de compatibilité (art. 6.4) |

**Concurrents :** HubSpot adopte explicitement cette double qualification (Processor pour données clients, Controller pour enrichissement et tracking code). Pennylane mentionne expressément un double rôle dans sa Convention de Traitement des Données. Axonaut et Sellsy restent dans un modèle simple de sous-traitant pur. Salesforce se positionne strictement comme Processor dans son DPA européen.

**Risque :** Modéré si documentation rigoureuse (registre art. 30 à deux sections, DPA explicite). Le risque principal est la **requalification** par la CNIL si la séparation n'est pas documentée et effective. Montant estimé pour un SaaS TPE/PME : **10 000 à 150 000 €** (proportionné au CA).

### Q2 — La co-responsabilité est un piège pour un SaaS B2B ciblant les TPE

**ZONE GRISE — Juridiquement possible mais stratégiquement déconseillé pour Satorea.**

Les arrêts **Wirtschaftsakademie (C-210/16)** et **Fashion ID (C-40/17)** ont élargi la co-responsabilité : elle existe dès qu'un acteur participe à la détermination des finalités et moyens, même sans accès direct aux données. L'arrêt **IAB Europe (C-604/22, 7 mars 2024)** va plus loin : édicter un standard technique encadrant un écosystème de traitement peut suffire à conférer la qualité de co-responsable.

Cependant, la co-responsabilité entraîne une **responsabilité solidaire** (art. 82(4) RGPD) : chaque co-responsable peut être tenu pour l'intégralité du dommage. Pour un SaaS ciblant des TPE esthétiques (1 à 5 personnes, peu de ressources juridiques), cela signifierait que Satorea supporterait seule les conséquences d'un manquement du client. La **sanction Criteo (SAN-2023-009, 40 M€)** pour défaut d'accord de co-responsabilité art. 26 illustre le risque. De plus, les TPE clientes n'ayant aucune maîtrise des moyens techniques, la CNIL pourrait requalifier Satorea en **responsable de traitement unique**.

**Recommandation :** Privilégier la double casquette ST/RT (Q1) plutôt que la co-responsabilité. Réserver l'art. 26 aux partenariats stratégiques entre acteurs de taille comparable.

### Q3 — L'intérêt légitime couvre largement les analytics d'usage SaaS

**OUI — Base légale adaptée, avec un périmètre bien établi par la CNIL et la CJUE.**

L'arrêt **Meta c. Bundeskartellamt (C-252/21, 4 juillet 2023)** confirme que les intérêts commerciaux peuvent constituer un intérêt légitime, avec un contrôle de nécessité strict. L'arrêt **KNLTB (C-621/22, 4 octobre 2024)** confirme qu'un intérêt purement commercial peut être légitime s'il est licite. Les **recommandations CNIL IA de 2025** reconnaissent explicitement que l'amélioration de produits/services peut constituer un intérêt légitime pour le développement de systèmes d'IA.

Le test en 3 étapes (Legitimate Interest Assessment) selon la CNIL et l'EDPB (Guidelines 1/2024, publiées octobre 2024) :

**Étape 1 — Légitimité :** L'amélioration du produit SaaS, l'optimisation des parcours utilisateur, la détection de bugs sont des intérêts légitimes reconnus.

**Étape 2 — Nécessité :** Collecter des métriques d'usage (pages visitées, temps passé, fonctionnalités utilisées) est nécessaire pour améliorer le produit. La pseudonymisation renforce la proportionnalité.

**Étape 3 — Balance :** En contexte B2B (professionnels, pas consommateurs vulnérables), les attentes raisonnables jouent en faveur de l'éditeur. Les utilisateurs d'un SaaS s'attendent à ce que l'éditeur analyse l'usage.

**Ce qui est admis :** analytics d'usage agrégés/pseudonymisés, amélioration des performances, détection de bugs, A/B testing, benchmarking anonymisé, sécurité réseau (considérant 49 RGPD). **Ce qui est refusé :** publicité ciblée individualisée sans consentement (C-252/21), profilage fin révélant l'intimité, revente de données à des tiers, utilisation de données de santé via l'intérêt légitime (art. 9 — base insuffisante pour données sensibles).

**Alerte secteur esthétique :** Si les fiches clients contiennent des informations sur des soins esthétiques qualifiables de données de santé (art. 9), l'intérêt légitime est **insuffisant**. Le consentement explicite (art. 9(2)(a)) serait nécessaire.

**Risque :** Faible si la LIA est documentée et les mesures additionnelles en place (pseudonymisation, droit d'opposition art. 21, information transparente). Montant estimé : **10 000 à 100 000 €** en cas de manquement.

---

## BLOC 2 — Les usages concrets : ce qui est faisable et à quel prix

### Q4 — L'accès permanent aux données est légal s'il est documenté comme instruction

**ZONE GRISE — Possible mais très strictement encadré par l'art. 28(3)(a).**

L'accès technique permanent n'est légal que s'il est **strictement nécessaire** à l'exécution du service (maintenance, support, sécurité), **documenté** dans le DPA comme instruction explicite du client, et **limité au minimum nécessaire** (minimisation, art. 5(1)(c)). L'**EDPB Opinion 22/2024** renforce cette position : le contrat doit préciser la nature de l'accès et les finalités.

Si Satorea utilise cet accès pour des finalités propres (analytics, amélioration produit), elle **change de qualification** et devient RT pour ces traitements. La formulation dans le DPA doit distinguer clairement : (1) une clause « accès technique » pour le service (hébergement, maintenance, sécurité — qualification ST) et (2) une clause « traitements pour compte propre » avec sa propre base légale (qualification RT).

**Sanctions de référence :** Dedalus Biologie (1,5 M€, 2022), Discord (800 000 €, 2022), Canal+ (600 000 €, 2023), Vodafone (550 000 €, 2025). **Risque :** amende potentielle de **150 000 à 500 000 €** si l'accès n'est pas documenté/justifié.

### Q5 — Les analytics cross-tenant exigent une anonymisation réelle, pas cosmétique

**OUI si véritablement anonymisé — ZONE GRISE si pseudonymisé seulement.**

L'**avis WP216** (Groupe Article 29, avril 2014) pose trois critères cumulatifs d'évaluation : **individualisation** (peut-on isoler un individu ?), **corrélation** (peut-on relier deux enregistrements ?), **inférence** (peut-on déduire une information ?). Si les trois critères sont satisfaits, les données sont a priori anonymes et sortent du champ RGPD. La pseudonymisation **n'est PAS** une méthode d'anonymisation — elle réduit la corrélabilité mais les données restent personnelles.

L'arrêt **EDPS c. SRB (C-413/23 P, 4 septembre 2025)** ouvre une brèche importante : les données pseudonymisées transmises à un tiers peuvent perdre leur caractère personnel **pour ce tiers** s'il ne dispose d'aucun moyen raisonnable de ré-identification. C'est l'approche « relative » de la donnée personnelle.

**Pipeline technique recommandé :** supprimer tous les identifiants directs et indirects → agréger avec un seuil minimum de **k=30** (contexte TPE esthétique = petits volumes) → appliquer differential privacy ou bruit statistique → supprimer les outliers identifiants → documenter dans une AIPD. **Attention spécifique :** dans le secteur esthétique TPE, la combinaison ville + type de prestation + date peut suffire à identifier une personne dans une petite ville.

**Concurrents :** noCRM.io conserve indéfiniment les données analytics Google même post-résiliation — point de vulnérabilité notable. HubSpot traite certaines données en qualité de Controller via son tracking code.

**Risque :** Modéré-élevé si l'anonymisation est défaillante. Amende jusqu'à **4% du CA** (art. 83(5)) pour traitement sans base légale.

### Q6 — L'entraînement IA sur patterns comportementaux est possible avec des garanties fortes

**OUI sous conditions — ZONE GRISE complexe nécessitant une documentation rigoureuse.**

Les **fiches pratiques CNIL sur l'IA** (14 fiches publiées entre avril 2024 et juin 2025) reconnaissent l'intérêt légitime comme base légale pour le développement de systèmes d'IA. La CNIL précise que « le développement des systèmes d'IA ne nécessite pas systématiquement le consentement des personnes ». Le **CEPD (avis 28/2024, décembre 2024)** rappelle qu'un modèle IA est anonyme seulement si : (1) il est « très peu probable » d'identifier les personnes dont les données ont servi à l'entraînement et (2) il est « très peu probable » d'extraire des données personnelles par requêtes.

**Distinction critique :** les patterns comportementaux agrégés (« les clients venant le mardi reviennent plus souvent ») ne sont pas des données personnelles s'ils ne permettent pas de remonter à un individu. Mais le **processus d'extraction** de ces patterns constitue un traitement soumis au RGPD.

**EU AI Act (Règlement 2024/1689) :** Un scoring de leads commerciaux dans le secteur beauté **n'est pas listé dans l'Annexe III** comme système à haut risque. L'Annexe III § 5(b) vise le credit scoring de personnes physiques, pas le scoring commercial/marketing B2B. Cependant, l'art. 6(3) in fine prévoit qu'un système de profilage de personnes physiques est **toujours** considéré haut risque. Un scoring de leads B2B individuel dans le secteur beauté reste en zone grise mais le risque de classification haut risque est **faible** (impact limité, pas de décision affectant les droits fondamentaux). Obligations de transparence art. 50 applicables dans tous les cas à partir d'**août 2026**.

**Mesures recommandées :** anonymiser les données avant l'entraînement, utiliser la differential privacy, documenter l'évaluation AI Act art. 6(4), réaliser une AIPD si profilage, prévoir des données synthétiques (GAN) comme alternative (recommandation CNIL 2025).

### Q7 — Les benchmarks sectoriels sont vendables si l'anonymisation est irréprochable

**OUI si données véritablement anonymes — NON si pseudonymisées seulement.**

Pour les données véritablement anonymisées (3 critères WP216 satisfaits), le RGPD ne s'applique plus et le contrat B2B suffit. La CNIL précise que « pour poursuivre une finalité statistique, le traitement doit avoir pour unique objet le calcul des données, leur affichage ou publication. Les résultats statistiques doivent constituer des données agrégées et anonymes. »

Satorea devient **indiscutablement responsable de traitement** pour les benchmarks vendus. Le contrat B2B doit **autoriser explicitement** la réutilisation à des fins de benchmark, avec un mécanisme d'opt-out. Information des personnes physiques obligatoire via la politique de confidentialité du client.

**Risque spécifique :** Dans le secteur esthétique TPE avec peu de clients par zone géographique, l'anonymisation effective est **difficile à atteindre**. Ne jamais publier de données si un segment ne contient qu'un seul institut identifiable dans une ville. Seuil k≥30, suppression des données géographiques précises, ajout de bruit statistique.

### Q8 — La conservation post-résiliation obéit à un régime en trois phases

**ZONE GRISE — Pas de durée unique ; articulation entre obligations légales et RGPD.**

La **délibération CNIL n°2021-131** (référentiel gestion commerciale) fixe : données clients actifs = durée de la relation, données de prospection = **3 ans** à compter du dernier contact. Après résiliation, le sous-traitant art. 28 doit restituer puis supprimer selon les instructions du client. Mais des obligations légales imposent la conservation au-delà : factures **10 ans** (Code de commerce), documents fiscaux **6 ans** (LPF), formation **4 à 12 ans** (Code du travail).

**Les données véritablement anonymisées peuvent être conservées indéfiniment** car elles sortent du champ RGPD — la CNIL le confirme explicitement. Régime en 3 phases recommandé : base active → archivage intermédiaire (accès restreint, justifié par obligation légale) → suppression/anonymisation.

**Sanctions de référence :** SERGIC (400 000 €, 2019) et Infogreffe (250 000 €, 2022) pour conservation excessive.

### Q9 — Les données Qualiopi bénéficient de durées de conservation longues mais variables

**OUI — Obligations de conservation spécifiques imposées par le Code du travail.**

| Document | Durée | Source |
|---|---|---|
| Bilan pédagogique et financier | **4 ans** | Art. R.6351-20 III Code du travail |
| BPF avec fonds européens | **12 ans** | Art. R.6351-20 IV Code du travail |
| Déclaration d'activité OF | Validité + **4 ans** | Art. R.6351-20 I Code du travail |
| Feuilles d'émargement | **3 ans minimum** (cycle Qualiopi) | Pratique sectorielle, pas de texte spécifique |
| Conventions de formation | **3 ans minimum** | Archivage réglementaire standard |

Le **décret 2019-565** (référentiel Qualiopi) impose 7 critères et 32 indicateurs de traçabilité documentaire mais **ne fixe pas de durée de conservation explicite**. Les obligations de preuve impliquent une conservation pendant le cycle de certification (3 ans renouvelable). Les données CPF/OPCO (documents d'identité, dossiers financement) doivent être conservées pour les contrôles DREETS et OPCO. Depuis le **décret 2023-1350**, les sous-traitants CPF doivent être eux-mêmes certifiés Qualiopi.

### Q10 — Les obligations fiscales imposent des durées de conservation qui priment sur le RGPD

**OUI — Obligations légales claires, le RGPD autorise expressément cette conservation (art. 6.1.c).**

| Document | Durée | Base légale |
|---|---|---|
| Documents comptables (livre-journal, grand livre, bilan) | **10 ans** | Art. L.123-22 Code de commerce |
| Pièces justificatives comptables (factures, relevés) | **10 ans** | Art. L.123-22 Code de commerce |
| Documents fiscaux (déclarations, pièces fiscales) | **6 ans** | Art. L.102 B du LPF |
| Registres opérations électroniques TVA | **10 ans** | Art. L.102 B I dernier alinéa LPF |
| Contrats électroniques ≥ 120 € | **10 ans** | Art. L.213-1 Code de la consommation |
| Prescription civile de droit commun | **5 ans** | Art. 2224 Code civil |

L'art. L.102 B LPF dispose : « Les livres, registres, documents ou pièces [...] doivent être conservés pendant un délai de **six ans** à compter de la date de la dernière opération. » Le Code de commerce porte ce délai à **10 ans** pour les documents comptables. Le RGPD autorise expressément cette conservation via l'art. 6.1.c (obligation légale), mais les données doivent passer en **archivage intermédiaire** (accès restreint). Les données de carte bancaire : durée limitée à la transaction + rétractation (délibération CNIL 2018-303).

---

## BLOC 3 — Les zones grises exploitables

### Q11 — Les clauses de licence sur les données personnelles sont illégales en droit européen

**NON pour les données personnelles — ZONE GRISE pour les données non-personnelles.**

L'art. 28(3)(a) RGPD impose que le sous-traitant « ne traite les données à caractère personnel que sur instruction documentée du responsable de traitement ». Une clause de licence mondiale non exclusive sur les données clients est **directement contraire** à ce principe : elle confère au sous-traitant un droit propre d'utilisation, transformant de facto le sous-traitant en RT. La **Cass. com. 25 juin 2013** a jugé qu'un fichier clients non conforme pouvait voir sa cession annulée.

**Concurrents :** Salesforce n'inclut pas de clause de licence dans son DPA européen. HubSpot contourne élégamment via un mécanisme de double qualification Controller/Processor distinct par fonctionnalité (l'enrichissement est traité en Controller-to-Controller). Les SaaS français (Axonaut, Sellsy, Pennylane) ne prévoient pas de clause de licence sur les données clients. **Risque :** jusqu'à **10 M€ ou 2% du CA** (art. 83.4 RGPD).

**Recommandation :** Ne jamais inclure de clause de licence sur les données personnelles. Pour les données anonymisées/agrégées, une clause contractuelle transparente est possible. Le modèle HubSpot (double qualification explicite par fonctionnalité) est la voie légale optimale.

### Q12 — Les données dérivées relèvent d'un régime hybride PI/RGPD

**ZONE GRISE — La propriété dépend de la nature personnelle ou non de la donnée dérivée.**

Trois catégories distinctes : (1) **données brutes** saisies par le client (nom, email, RDV) → le client en dispose, l'éditeur n'a aucun droit propre ; (2) **données d'usage** générées par la plateforme (logs, temps passé, clics) → si personnelles, soumises au RGPD ; si anonymisées, exploitables ; (3) **insights algorithmiques** (score de lead chaud, prédiction de churn) → le résultat rattaché à une personne identifiable est une donnée personnelle soumise au RGPD et potentiellement au profilage (art. 22), mais l'**algorithme lui-même** (modèle, pondérations, code) relève de la propriété intellectuelle de l'éditeur (art. L.112-2 13° CPI).

Le droit français ne reconnaît pas de « propriété » sur les données elles-mêmes. La voie contractuelle est le meilleur outil : distinguer dans le DPA données clients (restitution à la résiliation), données d'usage anonymisées (droit de l'éditeur), algorithmes et modèles (PI de l'éditeur).

### Q13 — Le droit sui generis protège l'infrastructure, pas le contenu des clients

**ZONE GRISE — Théoriquement invocable mais avec des limites importantes.**

La **Directive 96/9/CE** (transposée aux art. L.341-1 et suivants du CPI) protège le producteur d'une base de données qui démontre un investissement substantiel dans l'obtention, la vérification ou la présentation du contenu. L'arrêt fondateur **BHB c. William Hill (C-203/02, 2004)** distingue cependant l'investissement dans la **création** des données (non protégé) de l'investissement dans la **constitution** de la base (protégé).

Pour Satorea, les données sont saisies par les clients — l'investissement porte sur l'infrastructure technique (serveurs, architecture, indexation, vérification d'intégrité), ce qui **peut** constituer un investissement dans la présentation/vérification. L'arrêt **Ryanair (C-30/14, 2015)** confirme qu'en l'absence de droit sui generis certain, les **limitations contractuelles** restent le meilleur outil. La **structure** de la base (schéma relationnel, interfaces) est protégée par le droit d'auteur (art. L.112-3 CPI) si elle est originale. Durée de protection : **15 ans**, renouvelable.

**Recommandation :** Documenter les investissements infrastructure, mais privilégier la voie contractuelle (interdiction d'extraction/réutilisation dans les CGU). Le droit sui generis est un complément, pas une stratégie principale.

### Q14 — Les données clients sont cessibles en M&A mais avec des conditions strictes

**OUI — Les données font partie de l'actif cessible, sous conditions RGPD.**

Le RGPD ne contient aucune disposition spécifique sur les M&A. Le chapitre 5 ne vise que les transferts géographiques. Les conditions sont : (1) **due diligence** avec anonymisation/pseudonymisation en data room et minimisation ; (2) **information des personnes** (art. 14 RGPD) par l'acquéreur dans un délai d'1 mois ; (3) mise à jour du registre des traitements ; (4) pas de notification préalable CNIL obligatoire pour l'opération elle-même.

**Précédents critiques :** **Cass. com. 25 juin 2013, n°12-17037** — cession d'un fichier non déclaré CNIL annulée pour objet illicite. **Garante italiano (2022)** — 1,4 M€ au cessionnaire pour fichier CRM non conforme. Le cessionnaire **hérite des non-conformités**.

**Pour préparer la levée de fonds à 3-5 ans :** audit RGPD continu, registre des traitements à jour, DPA signés avec tous les clients, clause préventive dans la politique de confidentialité mentionnant la possibilité de transfert en cas de cession, clause de garantie RGPD dans le SPA futur.

### Q15 — Les données utilisateurs SaaS offrent une liberté d'exploitation supérieure

**OUI — Traitement juridiquement distinct, Satorea est responsable de traitement pour les données de connexion des utilisateurs.**

Satorea **détermine les finalités et moyens** du traitement des données de connexion des esthéticiennes (email, nom, logs, IP) → c'est un responsable de traitement. Base légale : exécution du contrat SaaS (art. 6.1.b) pour la gestion des comptes, **intérêt légitime** (art. 6.1.f) pour analytics produit et amélioration UX. Les données des leads/prospects des clients restent sous qualification ST (instructions uniquement).

**Exploitation possible des données utilisateurs :** analytics produit, A/B testing, amélioration UX, segmentation comportementale, sous réserve de minimisation, information transparente et droit d'opposition effectif. **Ne jamais croiser** les données des leads de différents instituts sans anonymisation irréversible.

---

## BLOC 4 — Le paysage des sanctions et contrôles dessine les priorités de conformité

### Q16 — La CNIL sanctionne directement les éditeurs SaaS depuis 2022

Les sanctions 2023-2025 contre des sous-traitants/éditeurs constituent un tournant. **MOBIUS Solutions (SAN-2025-014, 1 M€)** est le cas le plus pertinent pour Satorea : l'ancien sous-traitant de Deezer a copié et utilisé les données clients sans instruction pour améliorer ses propres services. **NEXPUBLICA France (SAN-2025-015, 1,7 M€)** — éditeur du logiciel PCRM pour les MDPH — sanctionné directement pour insuffisance de sécurité, même si le responsable de traitement est distinct. La CNIL a choisi de sanctionner l'éditeur plutôt que les MDPH car il contrôlait l'architecture technique.

**Bilan chiffré :** 2023 = 42 sanctions, ~90 M€ cumulés ; 2024 = 87 sanctions, 55,2 M€ ; 2025 = ~486,8 M€ (incluant 325 M€ contre Google). Les montants sont en **forte croissance**. La tendance est claire : les sous-traitants ne sont plus à l'abri. La CNIL sanctionne de plus en plus les éditeurs directement (art. 28 et 32 RGPD).

### Q17 — La jurisprudence CJUE récente renforce les possibilités d'exploitation des données anonymisées

Cinq arrêts structurent le cadre applicable au SaaS B2B :

**Wirtschaftsakademie (C-210/16)** et **Fashion ID (C-40/17)** définissent la co-responsabilité : application directe si Satorea intègre des traceurs tiers. **IAB Europe (C-604/22, mars 2024)** étend la co-responsabilité à l'édiction de standards techniques. **Deutsche Wohnen (C-807/21, décembre 2023)** confirme que le RT peut être sanctionné pour les traitements de ses sous-traitants. **EDPS c. SRB (C-413/23 P, septembre 2025)** — arrêt le plus favorable à Satorea — adopte une approche **relative** de la donnée personnelle : les données pseudonymisées transmises à un tiers peuvent ne plus être personnelles pour ce tiers s'il n'a aucun moyen raisonnable de ré-identification. Cet arrêt ouvre un levier juridique pour les benchmarks et analytics cross-tenant.

### Q18 — Satorea n'est pas dans le viseur immédiat, mais doit anticiper

**Les 4 thématiques prioritaires CNIL 2025** (plan du 21 mars 2025) sont : applications mobiles et SDK, cybersécurité des collectivités, administration pénitentiaire, droit à l'effacement. **La formation professionnelle et les CRM ne sont pas explicitement ciblés.** Cependant, le **référentiel d'évaluation des sous-traitants** est en cours d'élaboration (consultation publique achevée février 2025) et s'appliquera directement à Satorea. Des référentiels « durées de conservation » pour les activités commerciales/marketing sont en finalisation. L'**AI Act** entre en pleine application en août 2026, avec la CNIL comme autorité de régulation IA en France. Si Satorea a une application mobile, elle est dans le périmètre de contrôle 2025.

---

## BLOC 5 — Clauses juridiques prêtes à l'emploi

### Q19 — DPA complet et optimisé pour Satorea

**ACCORD DE TRAITEMENT DES DONNÉES (DPA)**
*Conforme au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés*

**ARTICLE 1 — QUALIFICATIONS ET RÔLES (art. 4(7), 4(8), 28(10) RGPD ; EDPB Guidelines 07/2020)**

*1.1 — Traitement pour le compte du Client (sous-traitance)*
« Pour les traitements décrits à l'Annexe A (hébergement, stockage et gestion des données CRM du Client, incluant les fiches contacts, rendez-vous, historiques de prestations, documents de formation), Satorea agit en qualité de sous-traitant au sens de l'article 28 du RGPD. Satorea ne traite ces données que sur instruction documentée du Client, conformément à l'article 28(3)(a) du RGPD. »

*1.2 — Traitements pour compte propre (responsabilité de traitement)*
« Pour les traitements décrits à l'Annexe B (données d'usage de la plateforme, métriques de navigation, logs techniques, données de performance du Service, analytics agrégés et anonymisés à des fins d'amélioration du Service et de production de statistiques sectorielles), Satorea agit en qualité de responsable de traitement au sens de l'article 4(7) du RGPD. Ces traitements sont fondés sur l'intérêt légitime de Satorea (article 6(1)(f) du RGPD), documenté dans l'évaluation d'intérêt légitime (LIA) disponible sur demande. Le Client dispose d'un droit d'opposition à ces traitements conformément à l'article 21 du RGPD, exerçable par notification écrite à dpo@satorea.com. »

*1.3 — Séparation des traitements*
« Les données traitées en qualité de sous-traitant (Annexe A) et celles traitées en qualité de responsable (Annexe B) sont logiquement et techniquement séparées. Aucune donnée personnelle identifiable issue de l'Annexe A n'est utilisée pour les finalités de l'Annexe B sans avoir préalablement fait l'objet d'un processus d'anonymisation irréversible conforme aux critères de l'avis WP216 du Groupe de travail Article 29. »

**ARTICLE 2 — ACCÈS TECHNIQUE AUX DONNÉES (art. 28(3), 29, 32 RGPD)**

*2.1 — Périmètre de l'accès*
« Dans le cadre de l'exécution du Service, Satorea dispose d'un accès technique aux données du Client limité aux opérations suivantes : hébergement et stockage, maintenance corrective et évolutive, support technique de niveaux 1 à 3, gestion des incidents de sécurité et sauvegardes, migration et portabilité des données. Cet accès est strictement limité au personnel habilité de Satorea, soumis à des obligations de confidentialité (article 28(3)(b) du RGPD), et tracé via des journaux d'accès consultables par le Client sur demande. »

*2.2 — Instruction permanente*
« Le Client donne à Satorea une instruction générale permanente pour les opérations techniques nécessaires à la bonne exécution du Service (article 28(3)(a) du RGPD). Cette instruction couvre l'ensemble des opérations décrites au paragraphe 2.1. Pour toute opération sortant de ce périmètre, Satorea sollicitera une instruction écrite spécifique du Client. »

**ARTICLE 3 — ANALYTICS ET DONNÉES AGRÉGÉES (art. 6(1)(f), considérant 26, art. 89 RGPD)**

*3.1 — Analytics cross-tenant anonymisés*
« Le Client autorise expressément Satorea à intégrer ses données, après anonymisation irréversible, dans des analyses statistiques transversales portant sur l'ensemble de la base utilisateurs du Service (ci-après "Analytics Cross-Tenant"). Le processus d'anonymisation appliqué satisfait cumulativement les trois critères de l'avis WP216 : impossibilité d'individualisation, de corrélation et d'inférence. Les données anonymisées ne constituent pas des données à caractère personnel au sens de l'article 4(1) du RGPD et du considérant 26. Le Client peut s'opposer à l'inclusion de ses données dans les Analytics Cross-Tenant par notification écrite, sans que cela n'affecte le fonctionnement du Service. »

*3.2 — Données dérivées et propriété intellectuelle*
« Les données brutes saisies par le Client dans le Service restent sous son entière disposition. Satorea s'engage à les restituer et/ou supprimer conformément à l'article 7. Les algorithmes, modèles, pondérations et code source développés par Satorea constituent des œuvres protégées par le droit d'auteur (article L.112-2 13° du Code de la propriété intellectuelle) et restent la propriété exclusive de Satorea. Les insights et scores générés par les algorithmes de Satorea à partir des données du Client (ex : score d'engagement) sont mis à disposition du Client pendant la durée du contrat et constituent des données personnelles soumises au RGPD lorsqu'ils sont rattachés à une personne identifiable. »

**ARTICLE 4 — BENCHMARKS SECTORIELS (art. 6(1)(f), considérant 26 RGPD)**

« Satorea peut produire et diffuser des rapports statistiques sectoriels (ci-après "Benchmarks") à partir de données exclusivement agrégées et anonymisées provenant de l'ensemble de ses clients. Ces Benchmarks ne contiennent aucune donnée permettant d'identifier directement ou indirectement un client de Satorea, une personne physique, ou un établissement individuel. Le seuil minimum d'agrégation est fixé à 30 entités par segment statistique. Le Client peut s'opposer à l'inclusion de ses données anonymisées dans les Benchmarks par notification écrite. Cette opposition prend effet dans un délai de 30 jours. »

**ARTICLE 5 — SOUS-TRAITANTS ULTÉRIEURS (art. 28(2) et (4) RGPD)**

« Satorea recourt aux sous-traitants ultérieurs listés à l'Annexe C (incluant à la date de signature : Supabase Inc. — hébergement PostgreSQL, Francfort EU ; Stripe Inc. — traitement des paiements ; Vercel Inc. — infrastructure applicative ; Resend Inc. — envoi d'emails transactionnels). Chaque sous-traitant ultérieur est lié par un contrat conforme à l'article 28(4) du RGPD. Pour les sous-traitants établis hors UE, des clauses contractuelles types (Décision 2021/914) et une évaluation de l'impact du transfert (TIA) sont mises en œuvre conformément au chapitre V du RGPD et à l'arrêt Schrems II (CJUE C-311/18). Le Client dispose d'un délai de 30 jours pour s'opposer à tout nouveau sous-traitant ultérieur notifié par Satorea. »

**ARTICLE 6 — SÉCURITÉ ET CONFORMITÉ (art. 32 RGPD)**

« Satorea met en œuvre les mesures techniques et organisationnelles suivantes : chiffrement en transit (TLS 1.3) et au repos (AES-256), contrôle d'accès basé sur les rôles (RBAC), journalisation des accès avec conservation de 12 mois, sauvegardes quotidiennes chiffrées avec rétention de 30 jours, tests d'intrusion annuels, politique de gestion des vulnérabilités. En cas de violation de données à caractère personnel, Satorea notifie le Client dans un délai maximum de 48 heures après en avoir pris connaissance, conformément à l'article 33(2) du RGPD. »

**ARTICLE 7 — DURÉE DE CONSERVATION ET SORT DES DONNÉES (art. 5(1)(e), 28(3)(g) RGPD)**

*7.1 — Pendant le contrat*
« Les données du Client sont conservées en base active pendant toute la durée du contrat d'abonnement. »

*7.2 — À la résiliation*
« À la résiliation du contrat, Satorea met à disposition du Client un export complet de ses données dans un format structuré, couramment utilisé et lisible par machine (CSV, JSON) conformément au droit à la portabilité (article 20 du RGPD). Le Client dispose d'un délai de 60 jours à compter de la résiliation pour récupérer ses données. À l'expiration de ce délai, Satorea procède à la suppression des données personnelles de la base active, sous réserve des obligations de conservation légales ci-dessous. »

*7.3 — Archivage intermédiaire (survie post-résiliation)*
« Conformément aux obligations légales applicables, les données suivantes sont conservées en archivage intermédiaire à accès restreint après la résiliation :
— Factures et pièces comptables : 10 ans (article L.123-22 du Code de commerce) ;
— Documents fiscaux : 6 ans (article L.102 B du Livre des procédures fiscales) ;
— Documents de formation professionnelle (présences, évaluations, bilans pédagogiques) : durée du cycle de certification Qualiopi en cours + 4 ans (article R.6351-20 du Code du travail), portée à 12 ans en cas de co-financement par des fonds européens (article R.6351-20 IV du Code du travail) ;
— Données nécessaires à la constatation, l'exercice ou la défense de droits en justice : 5 ans (article 2224 du Code civil).
Les données anonymisées à des fins statistiques peuvent être conservées sans limitation de durée (considérant 26 du RGPD). »

**ARTICLE 8 — CESSION ET TRANSFERT (art. 13, 14 RGPD)**

« En cas de fusion, acquisition, cession d'actifs ou de tout événement entraînant un changement de contrôle de Satorea, les données traitées en qualité de sous-traitant seront transférées au cessionnaire sous réserve du maintien de l'intégralité des garanties du présent DPA. Le Client sera informé de ce transfert dans un délai raisonnable. Le cessionnaire sera tenu par l'ensemble des obligations du présent accord. »

### Q20 — Clause CGU pour les données d'usage

« **Données d'usage et analytics** — Dans le cadre de la fourniture du Service, Satorea collecte et traite, en qualité de responsable de traitement (article 4(7) du RGPD), des données relatives à l'utilisation du Service par l'Utilisateur, incluant : journaux de connexion et d'activité, temps passé par fonctionnalité, actions réalisées (clics, créations, modifications), données techniques de session (type de navigateur, résolution d'écran, système d'exploitation), métriques de performance et de disponibilité du Service, données d'interaction avec les fonctionnalités (taux d'utilisation, parcours de navigation). Cette collecte est fondée sur l'intérêt légitime de Satorea (article 6(1)(f) du RGPD), conformément au test de mise en balance suivant : (i) Intérêt poursuivi : amélioration continue du Service, détection et correction des anomalies, optimisation de l'expérience utilisateur, développement de nouvelles fonctionnalités — intérêt réel, présent et licite ; (ii) Nécessité : ces données sont indispensables à l'amélioration du Service et ne peuvent être remplacées par des moyens moins intrusifs ; (iii) Balance des intérêts : l'Utilisateur, professionnel du secteur esthétique utilisant un outil métier dans un contexte B2B, peut raisonnablement s'attendre à ce que l'éditeur analyse l'usage pour améliorer le Service. Les données collectées sont pseudonymisées et ne sont pas utilisées à des fins de prospection commerciale de tiers. L'Utilisateur dispose d'un droit d'opposition à ce traitement (article 21 du RGPD), exerçable à tout moment via les paramètres du compte ou par email à dpo@satorea.com. L'exercice de ce droit n'affecte pas le fonctionnement du Service. »

### Q21 — Clause données anonymisées

« **Exploitation des données anonymisées** — Satorea applique aux données du Service un processus d'anonymisation irréversible conforme aux standards du Groupe de travail Article 29 (avis WP216 du 10 avril 2014) et aux recommandations de la CNIL. Ce processus garantit la satisfaction cumulative des trois critères d'anonymisation : (a) impossibilité d'individualisation — aucun individu ne peut être isolé dans le jeu de données ; (b) impossibilité de corrélation — aucun lien ne peut être établi entre des ensembles de données distincts concernant un même individu ; (c) impossibilité d'inférence — aucune information ne peut être déduite avec une probabilité significative concernant un individu. Les techniques mises en œuvre incluent, selon les cas : suppression des identifiants directs et indirects, agrégation avec seuil minimum de 30 individus par groupe, application de mécanismes de confidentialité différentielle (differential privacy) avec paramètre epsilon calibré selon la sensibilité des données, généralisation des attributs quasi-identifiants. Les données ainsi anonymisées ne constituent pas des données à caractère personnel au sens de l'article 4(1) du RGPD et du considérant 26, et peuvent être utilisées par Satorea sans limitation de finalité, de durée ou de territoire, notamment à des fins de recherche, de développement, de publication statistique et de commercialisation de rapports sectoriels. Satorea réévalue périodiquement la robustesse de son processus d'anonymisation au regard de l'évolution des techniques de ré-identification. »

### Q22 — Clause benchmark et insights sectoriels

« **Rapports statistiques et benchmarks sectoriels** — Satorea est autorisée à produire, publier et commercialiser des rapports statistiques portant sur le secteur de l'esthétique et de la formation professionnelle en France (ci-après "Benchmarks Sectoriels"), élaborés exclusivement à partir de données agrégées et anonymisées conformément à l'article précédent. Ces Benchmarks peuvent inclure des indicateurs tels que : taux de conversion moyen par source d'acquisition, fréquence moyenne de visite par catégorie de prestation, saisonnalité de l'activité par zone géographique, tendances de l'offre de formation. Aucun Benchmark ne contient de données permettant d'identifier directement ou indirectement un client de Satorea, un de ses utilisateurs, ou un établissement individuel. Chaque segment statistique publié repose sur un minimum de 30 établissements contributeurs. Le Client peut s'opposer à l'intégration de ses données anonymisées dans les Benchmarks Sectoriels par notification écrite à dpo@satorea.com. Le Client bénéficie d'un accès gratuit aux Benchmarks Sectoriels pendant la durée de son abonnement, dans leur version standard. »

### Q23 — Clause de survie post-résiliation

« **Survie des obligations et conservation post-résiliation** — Les stipulations suivantes survivent à la résiliation du Contrat pour quelque cause que ce soit :

(a) *Obligations comptables et fiscales* — Les factures, pièces justificatives comptables et documents fiscaux sont conservés en archivage intermédiaire sécurisé pour une durée de dix (10) ans à compter de leur établissement (article L.123-22 du Code de commerce) et six (6) ans pour les documents fiscaux (article L.102 B du Livre des procédures fiscales), conformément à l'article 6(1)(c) du RGPD (obligation légale).

(b) *Obligations de formation professionnelle* — Les documents relatifs aux actions de formation (feuilles d'émargement, évaluations, attestations, bilans pédagogiques et financiers) sont conservés pour une durée de quatre (4) ans à compter de leur établissement (article R.6351-20 du Code du travail), portée à douze (12) ans en cas de co-financement européen (article R.6351-20 IV du Code du travail).

(c) *Gestion des contentieux* — Les données nécessaires à la constatation, l'exercice ou la défense de droits en justice sont conservées pendant la durée de la prescription civile applicable, soit cinq (5) ans (article 2224 du Code civil) ou dix (10) ans pour les obligations entre commerçants (article L.110-4 du Code de commerce).

(d) *Données anonymisées* — Les données ayant fait l'objet d'un processus d'anonymisation irréversible conforme à l'avis WP216 sont conservées sans limitation de durée (considérant 26 du RGPD). Cette conservation vise les finalités de recherche, de développement du Service et de production de Benchmarks Sectoriels.

(e) *Propriété intellectuelle* — Les algorithmes, modèles, pondérations et résultats d'apprentissage développés par Satorea à partir de données anonymisées restent la propriété exclusive de Satorea au-delà de la résiliation, conformément aux articles L.112-2 et L.341-1 du Code de la propriété intellectuelle.

Durant la période d'archivage intermédiaire, l'accès aux données est strictement limité au personnel habilité de Satorea pour les seules finalités de conservation légale, et les mesures de sécurité prévues au présent accord continuent de s'appliquer. »

---

## Ce que cette analyse change pour la stratégie de Satorea

L'architecture juridique optimale pour Satorea repose sur **quatre piliers** qui se renforcent mutuellement. Le premier est la double qualification fonctionnelle (sous-traitant pour les données CRM, responsable pour les données d'usage), conforme aux Guidelines EDPB 07/2020 et au modèle déjà déployé par HubSpot et Pennylane. Le deuxième est un pipeline d'anonymisation technique documenté (PostgreSQL Supabase → vue matérialisée anonymisée → analytics cross-tenant), avec un seuil k≥30 et differential privacy, transformant les données personnelles en actif exploitable hors RGPD. Le troisième est l'exploitation des durées de conservation légales longues (10 ans comptables, 12 ans Qualiopi avec fonds européens, 5 ans prescription civile) comme levier de rétention d'actif en archivage intermédiaire. Le quatrième est la valorisation des données anonymisées et des algorithmes propriétaires comme actifs de propriété intellectuelle cessibles en M&A.

L'arrêt **EDPS c. SRB (C-413/23 P, septembre 2025)** sur l'approche relative de la donnée personnelle constitue le levier jurisprudentiel le plus favorable pour Satorea : il valide le principe selon lequel des données pseudonymisées peuvent ne plus être personnelles pour un destinataire sans moyen de ré-identification. Combiné à un processus d'anonymisation robuste et documenté, ce précédent sécurise la commercialisation des benchmarks sectoriels.

Le risque principal n'est pas la sanction CNIL directe (probabilité faible pour une TPE), mais la **requalification** en responsable de traitement pour des traitements présentés comme de la sous-traitance — exactement le scénario MOBIUS/Deezer. La transparence contractuelle (clauses DPA distinguant explicitement les deux qualifications avec leurs bases légales respectives) est la meilleure protection. Enfin, le **référentiel CNIL d'évaluation des sous-traitants** (en cours de finalisation) et l'entrée en application de l'**AI Act en août 2026** imposent d'anticiper dès maintenant la documentation de conformité pour l'IA intégrée au CRM.