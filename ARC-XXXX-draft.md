---
arc: 12
title: Smart Signature Convention for Claimable Algorand Standard Assets (ASA)
description: Conventions for a TEAL smart signature contract account to hold claimable Algorand Smart Assets (ASA) on behalf of an Algorand account
author: Brian Whippo (@silentrhetoric)
status: Draft
type: Standards Track
category: ARC
created: 2022-09-05
---

# Smart Signature Convention for Claimable Algorand Standard Assets (ASA)

## Summary

This document introduce conventions for 

## Abstract

The goal of these conventions is 


## Specification

The key words "**MUST**", "**MUST NOT**", "**REQUIRED**", "**SHALL**", "**SHALL NOT**", "**SHOULD**", "**SHOULD NOT**", "**RECOMMENDED**", "**MAY**", and "**OPTIONAL**" in this document are to be interpreted as described in [RFC-2119](https://www.ietf.org/rfc/rfc2119.txt).

> Comments like this are non-normative.

An ARC-12 ...

### Overview

### Smart Signatures

#### Examples

## Rationale

Algorand's protocol requires that accounts must opt in to be able to receive Algorand Standard Assets (ASA), which creates a barrier for use cases in which one may want to send an ASA to an account which has not yet opted in.  This proposal creates a standard for a deterministic claimables account, mapped one-to-one to any other Algorand account, so that anyone can send an ASA in such a way that it can only be claimed by the intended recipient at their convience.  

### Contemplated Use Cases

The following use cases help explain how this capability can enhance the possibilities within the Algorand ecosystem.

#### Airdrops

An ASA creator who wants to send their asset to a set of accounts faces the challenge of needing their intended recipients to opt in to the ASA ahead of time, which requires non-trivial communication efforts and precludes the possibility of completing the airdrop as a surprise.  

#### Reducing New User On-boarding Friction

An application operator who wants to on-board users to their game or business may want to reduce the friction of getting people started by decoupling their application on-boarding process from the process of setting up a non-custodial Algorand wallet for users who are wholly new to the Algorand ecosystem.  With the ability to send an ASA to the user ahead of them 

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## What belongs in a successful ARC?

Each ARC should have the following parts:

- [x] Preamble - RFC 822 style headers containing metadata about the ARC, including the ARC number, a short descriptive title (limited to a maximum of 44 characters), a description (limited to a maximum of 140 characters), and the author details. Irrespective of the category, the title and description should not include ARC numbers. See [below](./arc-0000.md#arc-header-preamble) for details.
- [ ] Abstract - This is a multi-sentence (short paragraph) technical summary. It should be a very terse and human-readable version of the specification section. Someone should be able to read only the abstract to get the gist of what this specification does.
- [ ] Specification - The technical specification should describe the syntax and semantics of any new feature. The specification should be detailed enough to allow competing, interoperable implementations for any of the current Algorand clients.
- [ ] Rationale - The rationale fleshes out the specification by describing what motivated the design and why particular design decisions were made. It should describe alternate designs that were considered and related work, e.g., how the feature is supported in other languages. The rationale may also provide evidence of consensus within the community and should discuss significant objections or concerns raised during discussions.
- [ ] Backwards Compatibility - All ARCs that introduce backward incompatibilities must include a section describing these incompatibilities and their severity. The ARC must explain how the author proposes to deal with these incompatibilities. ARC submissions without a sufficient backward compatibility treatise may be rejected outright.
- [ ] Test Cases - Test cases for implementation are mandatory for ARCs that are affecting consensus changes. Tests should either be inlined in the ARC as data (such as input/expected output pairs, or included in `../assets/arc-###/<filename>`.
- [ ] Reference Implementation - An optional section that contains a reference/example implementation that people can use to assist in understanding or implementing this specification.
- [ ] Security Considerations - All ARCs must contain a section that discusses the security implications/considerations relevant to the proposed change. Include information that might be important for security discussions, surfaces risks, and can be used throughout the life-cycle of the proposal. E.g., include security-relevant design decisions, concerns, essential discussions, implementation-specific guidance and pitfalls, an outline of threats and risks, and how they are being addressed. ARC submissions missing the "Security Considerations" section will be rejected. An ARC cannot proceed to status "Final" without a Security Considerations discussion deemed sufficient by the reviewers.
- [x] Copyright Waiver - All ARCs must be in the public domain. See the bottom of this ARC for an example copyright waiver.