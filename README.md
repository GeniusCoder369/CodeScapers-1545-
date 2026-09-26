# Case Ledger

A lightweight web app for organizing fraud evidence into a clear, chronological timeline and exportable report.

## Problem Statement 3: Organizing Evidence After an Online Fraud Incident

### Problem Description

After an online fraud incident, information is often scattered across chat messages, screenshots, payment notifications, bank records, emails, URLs, phone numbers, and call logs. The information may not be arranged in chronological order, important details may be missing, and sensitive personal information may be shared unnecessarily.

This makes it difficult for victims or support workers to prepare a clear and accurate account of what happened. The challenge is to help users organize available evidence into a structured incident record and identify missing information, without deciding whether someone is legally guilty or replacing official reporting channels.

### What Needs to Be Built

Develop a solution that helps a small organization combine, check, interpret, and report a limited set of program data.

The solution may support:
- Importing and combining multiple small datasets.
- Detecting duplicate, missing, or inconsistent records.
- Matching different column names or data formats.
- Finding and documenting program metrics.
- Generating a report or summary view.
- Linking reported figures back to their source records.
- Showing missing data, assumptions, or unresolved inconsistencies.

### Key Requirements

Develop a solution that helps users organize evidence from an online fraud incident into a clear, chronological, and privacy-conscious report.

The solution may support:
- Accepting synthetic chat messages, screenshots, transaction details, URLs, phone numbers, or other sample evidence.
- Extracting important details such as dates, amounts, transaction references, links, and contact information.
- Creating a chronological incident timeline and a defined reporting checklist.

---

## Project Overview

Case Ledger is a simple front-end dashboard that lets users record fraud-related evidence as individual entries, organize them by date/time, flag gaps or duplicates, and generate a polished report for review or sharing.

This project is built as a privacy-aware evidence organizer for fraud investigations. It stores entries locally in the browser and helps users keep a structured timeline without uploading sensitive information to a remote server.

## Features

- Add evidence records with type, date, time, description, amount, and source
- Group evidence into a chronological timeline
- Flag missing dates, missing transaction details, and likely duplicates
- Generate an incident report with checklist items
- Mask sensitive contact details before sharing or printing
- Copy or print the final report for review
- Works entirely in the browser with no backend required

## How It Works

1. Enter evidence such as chats, transactions, screenshots, URLs, emails, or call logs.
2. The app groups records by date and displays them in a timeline.
3. It automatically highlights likely issues, such as missing references or repeated transaction IDs.
4. The report generator creates a structured summary that helps users review what happened and what needs attention next.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Local browser storage (localStorage)

## Project Structure

```text
.
├── case-ledger.html
├── case-ledger.css
├── case-ledger.js
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser
- No installation required

### Run the App

1. Download or clone the repository.
2. Open `case-ledger.html` in your browser.
3. Start entering evidence and generate a report.

## Usage

### Add an Entry

Fill in the form with:
- Evidence type
- Date and time
- Description of what happened
- Amount, reference, contact information, and source

### Review Timeline

The timeline shows entries ordered chronologically and highlights records that may need review.

### Generate Report

Click the report button to create a summary that includes:
- chronological timeline
- issue review list
- reporting checklist

Use the masking toggle to hide sensitive information before sharing the report.

## Privacy Note

The application is designed to store entries locally on the user’s device. It does not upload evidence to a remote server, which helps reduce unnecessary exposure of personal or sensitive data.

## Potential Use Cases

- Fraud victim support workflows
- Small organization case intake
- Evidence tracking for scam or cybercrime incidents
- Internal review of suspicious transactions and communication trails

## Future Enhancements

- CSV import support
- Search and filtering
- Export to JSON or PDF
- Better duplicate detection rules
- Improved accessibility and mobile UX

## License

This project is currently distributed without a formal license file.

## Author

Built for the CodeScapers challenge focused on organizing evidence after online fraud incidents.

---

This project helps transform fragmented, scattered fraud evidence into one coherent record that can support reporting, review, and safer decision-making.
