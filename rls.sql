
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_building_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Test policy: Allow service role to view all profiles
CREATE POLICY "Service role can view all profiles"
    ON profiles FOR SELECT
    USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for organizations
CREATE POLICY "Allow users to view organizations" 
    ON organizations 
    FOR SELECT 
    USING (TRUE);

CREATE POLICY "Only admins can update organizations"
    ON organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
        )
    );

-- Create policies for buildings
CREATE POLICY "Users can view buildings they have access to"
    ON buildings FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = buildings.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Users can update their own buildings"
    ON buildings FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = buildings.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Users can insert buildings"
    ON buildings FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = buildings.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

-- Create policies for floor_plans
CREATE POLICY "Users can view floor plans they have access to"
    ON floor_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM buildings
            WHERE buildings.id = floor_plans.building_id
            AND (
                buildings.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = buildings.organization_id
                    AND organization_members.user_id = auth.uid()
                    AND organization_members.status = 'active'
                )
            )
        )
    );

CREATE POLICY "Users can modify floor plans they have access to"
    ON floor_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM buildings
            WHERE buildings.id = floor_plans.building_id
            AND (
                buildings.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = buildings.organization_id
                    AND organization_members.user_id = auth.uid()
                    AND organization_members.role = 'admin'
                    AND organization_members.status = 'active'
                )
            )
        )
    );

-- Create policies for elements
CREATE POLICY "Users can view elements they have access to"
    ON elements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM floor_plans
            JOIN buildings ON buildings.id = floor_plans.building_id
            WHERE floor_plans.id = elements.floor_plan_id
            AND (
                buildings.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = buildings.organization_id
                    AND organization_members.user_id = auth.uid()
                    AND organization_members.status = 'active'
                )
            )
        )
    );

CREATE POLICY "Users can modify elements they have access to"
    ON elements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM floor_plans
            JOIN buildings ON buildings.id = floor_plans.building_id
            WHERE floor_plans.id = elements.floor_plan_id
            AND (
                buildings.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = buildings.organization_id
                    AND organization_members.user_id = auth.uid()
                    AND organization_members.role = 'admin'
                    AND organization_members.status = 'active'
                )
            )
        )
    );

-- Create policies for building_notes
CREATE POLICY "Users can view notes they have access to"
    ON building_notes FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM buildings
            WHERE buildings.id = building_notes.building_id
            AND (
                buildings.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_members.organization_id = buildings.organization_id
                    AND organization_members.user_id = auth.uid()
                    AND organization_members.status = 'active'
                )
            )
        )
    );

CREATE POLICY "Users can modify their own notes"
    ON building_notes FOR ALL
    USING (user_id = auth.uid());

-- Create policies for organization_members
CREATE POLICY "Allow authenticated users to view organization members" 
    ON organization_members 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Organization admins can modify members"
    ON organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members AS om
            WHERE om.organization_id = organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role = 'admin'
            AND om.status = 'active'
        )
    );

-- Create policies for organization_buildings
CREATE POLICY "Users can view organization buildings they have access to"
    ON organization_buildings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organization_buildings.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Organization admins can modify organization buildings"
    ON organization_buildings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organization_buildings.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role = 'admin'
            AND organization_members.status = 'active'
        )
    );

-- Create policies for user_building_counts
CREATE POLICY "Users can view their own building counts"
    ON user_building_counts FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can modify their own building counts"
    ON user_building_counts FOR ALL
    USING (user_id = auth.uid());

-- Create policies for subscription_tiers
CREATE POLICY "Anyone can view subscription tiers"
    ON subscription_tiers FOR SELECT
    USING (true);

-- Only allow service_role to modify subscription tiers
CREATE POLICY "Only service_role can modify subscription tiers"
    ON subscription_tiers FOR ALL
    USING (auth.jwt()->>'role' = 'service_role'); 
