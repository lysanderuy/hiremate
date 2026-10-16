OWN_SKILLS = {
    "javascript": ["js", "ecmascript"], "typescript": ["ts"], "node.js": ["nodejs", "node"],
    "react": ["reactjs", "react.js"], "vue.js": ["vue", "vuejs"], "next.js": ["nextjs"], "express.js": ["expressjs"],
    "postgresql": ["postgres", "psql"], "mongodb": ["mongo"], "sql server": ["mssql", "ms sql"], "mysql": [],
    "amazon web services": ["aws"], "google cloud platform": ["gcp"], "microsoft azure": ["azure"],
    "kubernetes": ["k8s"], "docker": [], "terraform": [], "git": [], "github": [], "linux": [],
    "machine learning": ["ml"], "natural language processing": ["nlp"], "deep learning": [], "computer vision": [],
    "scikit-learn": ["sklearn"], "tensorflow": [], "pytorch": [], "pandas": [], "numpy": [],
    "power bi": ["powerbi"], "tableau": [], "microsoft excel": ["excel"],
    "c#": ["csharp"], "c++": ["cpp"], ".net": ["dotnet", ".net core"], "java": [], "python": [], "sql": [],
    "rest api": ["restful api", "rest apis", "restful apis"], "graphql": [], "ci/cd": ["continuous integration"],
    "html": ["html5"], "css": ["css3"],
    "julia language": ["julialang"], "shell scripting": ["shell script", "shell scripts", "bash scripting"],
    "software testing": ["qa testing", "manual testing", "automated testing", "test automation"],
    "windows server": [], "active directory": [], "vmware": [],
}

# risky name -> (name used instead, aliases)
RENAME = {
    "go": ("golang", ["go lang"]),
    "r": ("r programming", ["r language"]),
    "c": ("c programming", ["c language"]),
    "spring": ("spring boot", ["spring framework"]),
    "express": ("express.js", ["expressjs"]),
    "unity": ("unity3d", ["unity engine"]),
}

GENERIC = {
    "communication", "teamwork", "leadership", "problem solving", "problem-solving", "collaboration",
    "time management", "organization", "email", "internet", "computer", "software", "technology",
}

# skills_review.csv overrides these
DEFAULT_DECISIONS = {
    "react": "keep", "swift": "keep", "qt": "keep", "statistics": "keep", "windows": "keep",
    **{name: "drop" for name in (
        "abc animation assembly assessment calendar cents chat chef crystal database dental dig drawing editing "
        "educational facebook fastest fear flow forth google graphics icon impact instagram inventory j jet julia "
        "legal magic maintenance migration music notion phoenix posting prince productivity radar recipe reduce "
        "reporting route sales sand scheme shape sheets shell shipping sound square statistical survey switch tanks "
        "tax terminal testing timeline tracks training twitter video vision watson website wire word xv youtube "
        "cloud data security design"
    ).split()},
}
