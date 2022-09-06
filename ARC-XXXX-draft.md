---
arc: 12
title: Standard for Claimable Algorand Standard Assets (ASA)
description: Conventions for a TEAL smart signature contract account to hold claimable Algorand Smart Assets (ASA) on behalf of an Algorand account
authors: Brian Whippo (@silentrhetoric), Joe Polny (@joe-p)
status: Draft
type: Standards Track
category: ARC
created: 2022-09-05
---

# Standard for Claimable Algorand Standard Assets (ASAs)

## Summary

A standard for TEAL contract accounts to serve as a pending claimables account for Algorand Standard Assets for an intended recipient that is not opted in to the ASA.

## Abstract

The goal of this standard is to establish a standard in the Algorand ecosytem by which ASAs can be sent to an intended recipient even if their account is not opted in to the ASA.  A TEAL stateless smart signature contract account serves as a pending claimables account with logic that permits opting into incoming ASAs and subsequently for only the intended recipient to claim the ASA into their main account.  If integrated into ecosystem technologies including wallets, epxlorers, and dApps, this standard can provide enhanced capabilities around ASAs which are otherwise strictly bound at the protocol level to require opting in to be received.

## Definitions

- **Claimable ASA**: An Algorand Standard Asset (ASA) which has been transferred to a claimables account following the standard set forth in this proposal such that only the intended recipient account can claim it at their convenience.  
- **Claimables Account**: An Algorand contract account derived deterministically from the account of an intended ASA recipient plus a stateless TEAL smart signature that approves transactions originating from it.  
- **dApp**: A decentralized application frontend, interpreted here to mean an off-chain frontend (a webapp, native app, etc.) that interacts with Applications on the blockchain.
- **Explorer**: An off-chain application that allows browsing the blockchain, showing details of transactions.
- **Wallet**: An off-chain application that stores secret keys for on-chain accounts and can display and sign transactions for these accounts.

## Specification

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC-2119](https://www.ietf.org/rfc/rfc2119.txt).

> Comments like this are non-normative.

[To be added...]

### Overview

![Transaction Workflow Diagram](./src/assets/diagram.png)

### TEAL Stateless/Smart Signature Contract

[To be added...]

### Reference Implementation

To demonstrate how to interact with a claimable ASA account, a simple application has been deployed here: [https://claimable-asa-demo.netlify.app/](https://claimable-asa-demo.netlify.app/).

The demo site is a client side-only React single page application with MyAlgo wallet integration that provides the following functions:

1. Displaying a connected "main" account's current assets
2. Deriving the connected account's *associated claimable ASAs account* using the standard TEAL smart signature code
3. Displaying any ASAs in the claimables account which can be claimed by the connected "main" account
4. A utility to send ASAs from the connected account to an intended recipient, dynamically diverting the transfer to the appropriate claimable ASAs account if the recipient is not opted in to the ASA.

With this toolset it is possible to view one's own claimables account, claim ASAs from it, and automatically utilize other people's claimables account to send them any ASA.

## Rationale

Algorand's protocol requires that accounts must opt in to be able to receive ASAs, which creates a barrier for use cases in which one may want to send an ASA to an account which has not yet opted in.  This proposal creates a standard for a deterministic claimables account, mapped one-to-one to any other Algorand account, so that anyone can send an ASA in such a way that it can only be claimed by the intended recipient at their convience.

### Contemplated Use Cases

The following use cases help explain how this capability can enhance the possibilities within the Algorand ecosystem.

#### Airdrops

An ASA creator who wants to send their asset to a set of accounts faces the challenge of needing their intended recipients to opt in to the ASA ahead of time, which requires non-trivial communication efforts and precludes the possibility of completing the airdrop as a surprise.  This claimable ASA standard creates the ability to send an airdrop out to individual addresses so that the recipients can opt in and claim the asset at their convenience--or not, if they so choose.  

#### Reducing New User On-boarding Friction

An application operator who wants to on-board users to their game or business may want to reduce the friction of getting people started by decoupling their application on-boarding process from the process of funding a non-custodial Algorand wallet, if users are wholly new to the Algorand ecosystem.  As long as the recipient's address is known, an ASA can be sent to them ahead of them having ALGOs in their wallet to cover the minimum balance requirement and opt in to the asset.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## What belongs in a successful ARC?

Each ARC should have the following parts:

- [x] Preamble - RFC 822 style headers containing metadata about the ARC, including the ARC number, a short descriptive title (limited to a maximum of 44 characters), a description (limited to a maximum of 140 characters), and the author details. Irrespective of the category, the title and description should not include ARC numbers. See [below](./arc-0000.md#arc-header-preamble) for details.
- [x] Abstract - This is a multi-sentence (short paragraph) technical summary. It should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.
- [ ] Specification - The technical specification should describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Algorand clients.
- [x] Rationale - The rationale fleshes out the specification by describing what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g., how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community and should discuss significant objections or concerns raised during discussions.
- [x] Backwards Compatibility - All ARCs that introduce backward incompatibilities must include a section describing these incompatibilities and their severity. The ARC must explain how the author proposes to deal with these incompatibilities. ARC submissions without a sufficient backward compatibility treatise may be rejected outright.
- [ ] Test Cases - Test cases for implementation are mandatory for ARCs that are affecting consensus changes. Tests should either be inlined in the ARC as data (such as input/expected output pairs, or included in `../assets/arc-###/<filename>`.
- [x] Reference Implementation - An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.
- [ ] Security Considerations - All ARCs must contain a section that discusses the security implications/considerations relevant to the proposed change. Include information that might be important for security discussions, surfaces risks, and can be used throughout the life-cycle of the proposal. E.g., include security-relevant design decisions, concerns, essential discussions, implementation-specific guidance and pitfalls, an outline of threats and risks, and how they are being addressed. ARC submissions missing the "Security Considerations" section will be rejected. An ARC cannot proceed to status "Final" without a Security Considerations discussion deemed sufficient by the reviewers.
- [x] Copyright Waiver - All ARCs must be in the public domain. See the bottom of this ARC for an example copyright waiver.