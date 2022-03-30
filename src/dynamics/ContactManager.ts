import BroadPhase from "@broadphase/BroadPhase";
import List from "@collections/List";
import Box from "@collision/Box";
import { ContactConstraint } from "@dynamics";
import { ContactListener } from "@scene/Scene";

export default class ContactManager {
    BroadPhase: BroadPhase
    ContactList: List<ContactConstraint>
    ContactListener: ContactListener | null = null

    constructor() {
        this.BroadPhase = new BroadPhase(this)
        this.ContactList = new List<ContactConstraint>()
    }
    // Add a new contact constraint for a pair of objects
    // unless the contact constraint already exists
    AddContact(a: Box, b: Box): void {
        const bodyA = a.body
        const bodyB = b.body

        if (!bodyA.CanCollide(bodyB)) return


    }
}