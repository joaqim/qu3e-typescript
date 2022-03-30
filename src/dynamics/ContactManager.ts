import BroadPhase from "@broadphase/BroadPhase";
import List from "@collections/List";
import Box from "@collision/Box";
import { ContactConstraint } from "@dynamics";
import { ContactListener } from "@scene/Scene";
import { ContactEdge } from "./Contact";

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
        // Search for existing matching contact
        // Return if found duplicate to avoid duplicate constraints
        // Mark pre-existing duplicates as active
        //foreach(var edge in A.body.ContactList)
        a.body.ContactList.ForEach((edge: ContactEdge) => {
            if (edge.other == bodyB) {
                // TODO: check if edge.constraint can be undefined
                Assert(edge.constraint! !== undefined)
                const shapeA = edge.constraint!.A;
                const shapeB = edge.constraint!.B;

                // @TODO: Verify this against Box2D; not sure if this is all we need here
                if ((a == shapeA) && (b == shapeB))
                    return;
            }
        })

        // Create new contact
        var contact = new ContactConstraint(
            a,
            b,
            a.body,
            b.body,
            0,
            this.MixFriction(a, b),
            this.MixRestitution(a, b))

        contact.manifold.SetPair(a, b);

        this.ContactList.Add(contact);

        // Connect A
        contact.edgeA.constraint = contact;
        contact.edgeA.other = bodyB;
        bodyA.ContactList.Add(contact.edgeA);

        // Connect B
        contact.edgeB.constraint = contact;
        contact.edgeB.other = bodyA;
        bodyB.ContactList.Add(contact.edgeB);

        bodyA.SetToAwake();
        bodyB.SetToAwake();
    }
}