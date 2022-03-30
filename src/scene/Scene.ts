//--------------------------------------------------------------------------------------------------
/**
    Qu3e Physics Engine - C# Version 1.01

    Copyright (c) 2014 Randy Gaul http://www.randygaul.net

    This software is provided 'as-is', without any express or implied
    warranty. In no event will the authors be held liable for any damages
    arising from the use of this software.

    Permission is granted to anyone to use this software for any purpose,
    including commercial applications, and to alter it and redistribute it
    freely, subject to the following restrictions:
      1. The origin of this software must not be misrepresented; you must not
         claim that you wrote the original software. If you use this software
         in a product, an acknowledgment in the product documentation would be
         appreciated but is not required.
      2. Altered source versions must be plainly marked as such, and must not
         be misrepresented as being the original software.
      3. This notice may not be removed or altered from any source distribution.
*/
//--------------------------------------------------------------------------------------------------

import List from "@collections/List";
import type Box from "@collision/Box";
import type { ContactConstraint } from "@dynamics";
import { BodyFlags } from "@dynamics";
import type Body from "@dynamics/Body";
import type { ReadonlyVec3 } from "@math/Vec3";
import type Vec3 from "@math/Vec3";

class ContactManager {}
class Island {}

// This listener is used to gather information about two shapes colliding. This
// can be used for game logic and sounds. Physics objects created in these
// Callbacks will not be reported until the following frame. These Callbacks
// can be called frequently, so make them efficient.
export abstract class ContactListener {
  abstract BeginContact: (contact: ContactConstraint) => void;
  abstract EndContact: (contact: ContactConstraint) => void;
}

// This class represents general queries for points, AABBs and Raycasting.
// ReportShape is called the moment a valid shape is found. The return
// value of ReportShape controls whether to continue or stop the query.
// By returning only true, all shapes that fulfill the query will be re-
// ported.
export abstract class QueryCallback {
  abstract ReportShape: (box: Box) => boolean;
}

export default class Scene {
  private readonly ContactManager: ContactManager;

  private readonly Bodies: List<Body>;

  private readonly Gravity: Vec3;
  private readonly Dt: number;
  private readonly Iterations: number;

  private readonly NewBox: boolean;
  private readonly AllowSleep: boolean;
  private readonly EnableFriction: boolean;

  constructor(dt: number, gravity: ReadonlyVec3, iterations = 20) {
    this.ContactManager = new ContactManager();
    this.Island = new Island();

    this.Bodies = new List<Body>();
    this.Gravity = gravity;
    this.Dt = dt;
    this.Iterations = iterations;
    this.NewBox = false;
    this.AllowSleep = true;
    this.EnableFriction = true;
  }

  Island: Island;
  // Body[] stack = new Body[256];
  stack: Body[] = Array.from({ length: 256 });

  /*
    // Run the simulation forward in time by dt (fixed timestep). Variable
    // timestep is not supported.
    public Step(Dt: number): void {
        if (this.NewBox) {
            this.ContactManager.Broadphase.UpdatePairs();
            this.NewBox = false;
        }

        this.ContactManager.TestCollisions();

        for (var body in this.Bodies)
            body.Flags &= ~BodyFlags.eIsland;

        this.Island.AllowSleep = AllowSleep;
        this.Island.EnableFriction = EnableFriction;
        this.Island.Dt = Dt;
        this.Island.Gravity = Gravity;
        this.Island.Iterations = Iterations;

        // Build each active Island and then solve each built Island
        //            int stackSize = Bodies.Count;
        foreach(var seed in Bodies)
        {
            // Seed cannot be apart of an Island already
            if ((seed.Flags & BodyFlags.Island) > 0)
                continue;

            // Seed must be awake
            if ((seed.Flags & BodyFlags.Awake) == 0)
                continue;

            // Seed cannot be a static body in order to keep islands
            // as small as possible
            if ((seed.Flags & BodyFlags.Static) > 0)
                continue;

            var stackCount = 0;
            this.stack[stackCount++] = seed;
            this.Island.Clear();


            // Mark seed as apart of Island
            seed.Flags |= BodyFlags.Island;

            // Perform DFS on constraint graph
            while (stackCount > 0) {
                // Decrement stack to implement iterative backtracking
                body = this.stack[--stackCount];
                this.Island.Add(body);

                // Awaken all bodies connected to the Island
                body.SetToAwake();

                // Do not search across static bodies to keep Island
                // formations as small as possible, however the static
                // body itself should be apart of the Island in order
                // to properly represent a full contact
                if ((body.Flags & BodyFlags.Static) > 0)
                    continue;

                // Search all contacts connected to this body
                foreach(var edge in body.ContactList)
                {
                    contact = edge.constraint;

                    // Skip contacts that have been added to an Island already
                    if ((contact.Flags & ContactFlags.eIsland) > 0)
                        continue;

                    // Can safely skip this contact if it didn't actually collide with anything
                    if ((contact.Flags & ContactFlags.eColliding) == 0)
                        continue;

                    // Skip sensors
                    if (contact.A.sensor || contact.B.sensor)
                        continue;

                    // Mark Island flag and add to Island
                    contact.Flags |= ContactFlags.eIsland;
                    this.Island.Add(contact);

                    // Attempt to add the other body in the contact to the Island
                    // to simulate contact awakening propogation
                    var other = edge.other;
                    if ((other.Flags & BodyFlags.eIsland) > 0)
                        continue;

                    Assert(stackCount < 256);

                    this.stack[stackCount++] = other;
                    other.Flags |= BodyFlags.Island;
                }
            }

            Assert(this.Island.Bodies.Count != 0);

            this.Island.Initialize();
            this.Island.Solve();

            // Reset all static Island flags
            // This allows static bodies to participate in other Island formations
            foreach(var body in Island.Bodies)
            {
                if ((body.Flags & BodyFlags.eStatic) > 0)
                    body.Flags &= ~BodyFlags.eIsland;
            }
        }

        // Update the broadphase AABBs
        foreach(var body in Bodies)
        {
            if ((body.Flags & BodyFlags.eStatic) > 0)
                continue;

            body.SynchronizeProxies();
        }

        // Look for new contacts
        this.ContactManager.FindNewContacts();

        // Clear all forces
        foreach(var body in Bodies)
        {
            Vec3.Identity(ref body.Force);
            Vec3.Identity(ref body.Torque);
        }
    }

    // Construct a new rigid body. The BodyDef can be reused at the user's
    // discretion, as no reference to the BodyDef is kept.
    public Body CreateBody(BodyDef def) {
            Body body = new Body(def, this);

        // Add body to scene Bodies


        Bodies.Add(body);

        return body;
    }

    // Frees a body, removes all shapes associated with the body and frees
    // all shapes and contacts associated and attached to this body.
    RemoveBody(Body body) {


        ContactManager.RemoveContactsFromBody(body);

        body.RemoveAllBoxes();

        // Remove body from scene Bodies
        Assert(Bodies.Remove(body));
    }
    RemoveAllBodies() {


        foreach(var body in Bodies)
        {
            body.RemoveAllBoxes();
        }
        Bodies.Clear();
    }

    // Enables or disables rigid body sleeping. Sleeping is an effective CPU
    // optimization where bodies are put to sleep if they don't move much.
    // Sleeping bodies sit in memory without being updated, until the are
    // touched by something that wakes them up. The default is enabled.
    SetAllowSleep(bool allowSleep) {
        AllowSleep = allowSleep;

        if (!allowSleep) {
            foreach(var body in Bodies)
            body.SetToAwake();
        }
    }

    // Increasing the iteration count increases the CPU cost of simulating
    // Scene.Step(). Decreasing the iterations makes the simulation less
    // realistic (convergent). A good iteration number range is 5 to 20.
    // Only positive numbers are accepted. Non-positive and negative
    // inputs set the iteration count to 1.
    SetIterations(int iterations) {
        Iterations = Math.Max(1, iterations);
    }

    // Friction occurs when two rigid bodies have shapes that slide along one
    // another. The friction force resists this sliding motion.
    SetEnableFriction(bool enabled) {
        EnableFriction = enabled;
    }

    // Render the scene with an interpolated time between the last frame and
    // the current simulation step.
    Render(Render render) {

        foreach(var body in Bodies)
        {
            body.Render(render);
        }

        ContactManager.RenderContacts(render);
    }

    // Gets and sets the global gravity vector used during integration
    public Vec3 GetGravity() {
        return Gravity;
    }
    SetGravity(Vec3 gravity) {
        Gravity = gravity;
    }

    // Removes all bodies from the scene.
    Shutdown() {
        RemoveAllBodies();
    }

    // Sets the listener to report collision start/end. Provides the user
    // with a pointer to an ContactConstraint. The ContactConstraint
    // holds pointers to the two shapes involved in a collision, and the
    // two bodies connected to each shape. The ContactListener will be
    // called very often, so it is recommended for the funciton to be very
    // efficient. Provide a NULL pointer to remove the previously set
    // listener.
    SetContactListener(ContactListener listener) {
        ContactManager.ContactListener = listener;
    }

    public class SceneQueryAABBWrapper: ITreeCallback
        {
            public bool TreeCallback(int id)
    {
                AABB aabb;
                Box box = (Box)broadPhase.Tree.GetUserData(id);

        box.ComputeAABB(box.body.GetTransform(), out aabb);

        if (AABB.AABBtoAABB(Aabb, aabb)) {
            return cb.ReportShape(box);
        }

        return true;
    }

            internal QueryCallback cb;
            internal BroadPhase broadPhase;
            internal AABB Aabb;
};

        public struct SceneQueryPointWrapper: ITreeCallback
{
            public bool TreeCallback(int id)
    {
                Box box = (Box)broadPhase.Tree.GetUserData(id);

        if (box.TestPoint(box.body.GetTransform(), Point)) {
            cb.ReportShape(box);
        }

        return true;
    }

            internal QueryCallback cb;
            internal BroadPhase broadPhase;
            internal Vec3 Point;
};

        struct SceneQueryRaycastWrapper: ITreeCallback
{
            public bool TreeCallback(int id)
    {
                Box box = (Box)broadPhase.Tree.GetUserData(id);

        if (box.Raycast(box.body.GetTransform(), RayCast)) {
            return cb.ReportShape(box);
        }

        return true;
    }

            internal QueryCallback cb;
            internal BroadPhase broadPhase;
            internal RaycastData RayCast;
};


// Query the world to find any shapes that can potentially intersect
// the provided AABB. This works by querying the broadphase with an
// AAABB -- only *potential* intersections are reported. Perhaps the
// user might use lmDistance as fine-grained collision detection.
QueryAABB(QueryCallback cb, AABB aabb)
{

            SceneQueryAABBWrapper wrapper = new SceneQueryAABBWrapper();
    wrapper.Aabb = aabb;
    wrapper.broadPhase = ContactManager.Broadphase;
    wrapper.cb = cb;
    ContactManager.Broadphase.Tree.Query(wrapper, aabb);
}

// Query the world to find any shapes intersecting a world space point.
QueryPoint(QueryCallback cb, Vec3 point)
{
            SceneQueryPointWrapper wrapper;
    wrapper.Point = point;
    wrapper.broadPhase = ContactManager.Broadphase;
    wrapper.cb = cb;
            double k_fattener = 0.5f;
            Vec3 v = new Vec3(k_fattener, k_fattener, k_fattener);
            AABB aabb;
    aabb.min = point - v;
    aabb.max = point + v;
    ContactManager.Broadphase.Tree.Query(wrapper, aabb);
}

// Query the world to find any shapes intersecting a ray.
RayCast(QueryCallback cb, RaycastData rayCast)
{
            SceneQueryRaycastWrapper wrapper = new SceneQueryRaycastWrapper();
    wrapper.RayCast = rayCast;
    wrapper.broadPhase = ContactManager.Broadphase;
    wrapper.cb = cb;
    ContactManager.Broadphase.Tree.Query(wrapper, rayCast);
}

// Dump all rigid bodies and shapes into a log file. The log can be
// used as C++ code to re-create an initial scene setup. Contacts
// are *not* logged, meaning any cached resolution solutions will
// not be saved to the log file. This means the log file will be most
// accurate when dumped upon scene initialization, instead of mid-
// simulation.
Dump(StringBuilder file)
{
    file.Length = 0;
    file.AppendFormat("// Ensure 64/32-bit memory compatability with the dump contents\n");
    file.AppendFormat("scene.SetGravity( Vec3( {0}, {1}, {2} ) );\n", Gravity.x, Gravity.y, Gravity.z);
    file.AppendFormat("scene.SetAllowSleep( {0} );\n", AllowSleep ? "true" : "false");
    file.AppendFormat("scene.SetEnableFriction( {0} );\n", EnableFriction ? "true" : "false");

    file.AppendFormat("Body bodies = (Body)Alloc( Sizeof( Body ) * {0} );\n", Bodies.Count);

            int i = 0;
    foreach(var body in Bodies)
    {
        body.Dump(file, i);
    }

    file.AppendFormat("Free( bodies );\n");
}
*/
}
